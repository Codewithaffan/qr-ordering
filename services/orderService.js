import Order from "@/models/Order";
import Table from "@/models/Table";
import Restaurant from "@/models/Restaurant";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Counter from "@/models/Counter";
import { serialize } from "@/utils/serialize";
import { toMinor, fromMinor, calculateTotals } from "@/utils/money";
import { ACTIVE_STATUSES, ORDER_STATUSES, STATUS_TRANSITIONS } from "@/utils/constants";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/utils/errors";
import {
  assertObjectId, assertPlainObject, optionalString, optionalPhone, requireEnum, requireInt,
} from "@/utils/validators";
import { emitNewOrder, emitOrderUpdated, emitOrderStatusChanged } from "@/lib/socket";

const MAX_DISTINCT_ITEMS = 50;
const MAX_QTY_PER_ITEM = 50;

async function nextOrderNumber(restaurantId) {
  const counter = await Counter.findOneAndUpdate(
    { _id: `order:${restaurantId}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  ).lean();
  return `ORD-${1000 + counter.seq}`; // first order: ORD-1001
}

/** Validate + merge duplicate lines. The client only ever sends { productId, quantity }. */
function parseItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ValidationError("items: your cart is empty", { items: "At least one item is required" });
  }
  if (rawItems.length > MAX_DISTINCT_ITEMS) {
    throw new ValidationError(`items: too many items (max ${MAX_DISTINCT_ITEMS})`);
  }
  const merged = new Map();
  for (const raw of rawItems) {
    assertPlainObject(raw, "Each item must be an object");
    const productId = assertObjectId(raw.productId, "productId");
    const quantity = requireInt(raw.quantity, "quantity", { min: 1, max: MAX_QTY_PER_ITEM });
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }
  for (const qty of merged.values()) {
    if (qty > MAX_QTY_PER_ITEM) throw new ValidationError(`quantity: at most ${MAX_QTY_PER_ITEM} per item`);
  }
  return merged;
}

export async function createOrder(input) {
  assertPlainObject(input);
  const tableId = assertObjectId(input.tableId, "tableId");
  const items = parseItems(input.items);
  const customerName = optionalString(input.customerName, "customerName", { max: 60 });
  const customerPhone = optionalPhone(input.customerPhone, "customerPhone");
  const customerNote = optionalString(input.customerNote, "customerNote", { max: 300 });

  // 1-2. Validate table + restaurant
  const table = await Table.findById(tableId).lean();
  if (!table) throw new NotFoundError("Table not found");
  if (!table.isActive) throw new ForbiddenError("This table is not accepting orders right now");

  const restaurant = await Restaurant.findById(table.restaurantId).lean();
  if (!restaurant || !restaurant.isActive) throw new ForbiddenError("This restaurant is not accepting orders right now");

  // 3-5. Validate products and read REAL prices from the database (never from the client)
  const ids = [...items.keys()];
  const products = await Product.find({ _id: { $in: ids }, restaurantId: restaurant._id }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const activeCategories = await Category.find({
    _id: { $in: [...new Set(products.map((p) => String(p.categoryId)))] },
    restaurantId: restaurant._id,
    isActive: true,
  }).select("_id").lean();
  const activeCategoryIds = new Set(activeCategories.map((c) => String(c._id)));

  const unavailable = [];
  for (const id of ids) {
    const p = productMap.get(id);
    if (!p) throw new ValidationError("Some items are no longer on the menu. Please refresh and try again.");
    if (!p.isAvailable || !activeCategoryIds.has(String(p.categoryId))) unavailable.push(p.name);
  }
  if (unavailable.length) {
    throw new ConflictError(`Sorry, currently unavailable: ${unavailable.join(", ")}. Please remove and try again.`);
  }

  // 6-9. Totals computed on the server, in integer minor units
  const orderItems = ids.map((id) => {
    const p = productMap.get(id);
    const quantity = items.get(id);
    return {
      productId: p._id,
      name: p.name, // snapshot
      price: p.price, // snapshot
      quantity,
      subtotal: fromMinor(toMinor(p.price) * quantity),
      _minor: toMinor(p.price) * quantity,
    };
  });
  const totals = calculateTotals(
    orderItems.map((i) => i._minor),
    restaurant.settings?.taxPercentage || 0,
    restaurant.settings?.serviceChargePercentage || 0
  );
  orderItems.forEach((i) => delete i._minor);

  // 10-12. Order number + save
  const orderNumber = await nextOrderNumber(restaurant._id);
  const order = await Order.create({
    orderNumber,
    restaurantId: restaurant._id,
    tableId: table._id,
    tableNumber: table.tableNumber,
    items: orderItems,
    ...totals,
    status: "NEW",
    paymentStatus: "PENDING",
    customerName,
    customerPhone,
    customerNote,
  });

  const saved = serialize(order.toObject());

  // 13. Real-time notification. A socket problem must never fail an order that is already saved.
  try {
    emitNewOrder(String(restaurant._id), saved);
  } catch (err) {
    console.error("[orders] failed to emit new-order:", err);
  }

  // 14. Return details (customer-safe shape)
  return toPublicOrder(saved, restaurant);
}

/** Customer-facing order shape: no phone number, no internal ids beyond what tracking needs. */
function toPublicOrder(order, restaurant) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    tableId: order.tableId,
    tableNumber: order.tableNumber,
    items: order.items,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    serviceCharge: order.serviceCharge,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    customerName: order.customerName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    restaurant: restaurant
      ? { name: restaurant.name, currency: restaurant.settings?.currency || "INR" }
      : undefined,
  };
}

export async function getPublicOrder(orderId) {
  assertObjectId(orderId, "orderId");
  const order = await Order.findById(orderId).lean();
  if (!order) throw new NotFoundError("Order not found");
  const restaurant = await Restaurant.findById(order.restaurantId).select("name settings").lean();
  return toPublicOrder(serialize(order), restaurant);
}

export async function listAdminOrders(restaurantId, { status, page = 1, limit = 50 } = {}) {
  const filter = { restaurantId };
  if (status === "ACTIVE") filter.status = { $in: ACTIVE_STATUSES };
  else if (status) filter.status = requireEnum(status, "status", ORDER_STATUSES);

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Order.countDocuments(filter),
  ]);
  return serialize({ orders, total, page: safePage, limit: safeLimit });
}

export async function getAdminOrder(restaurantId, orderId) {
  assertObjectId(orderId, "orderId");
  const order = await Order.findOne({ _id: orderId, restaurantId }).lean();
  if (!order) throw new NotFoundError("Order not found");
  return serialize(order);
}

export async function updateOrderStatus(restaurantId, orderId, body) {
  assertObjectId(orderId, "orderId");
  assertPlainObject(body);
  const nextStatus = requireEnum(body.status, "status", ORDER_STATUSES);

  const current = await Order.findOne({ _id: orderId, restaurantId }).lean();
  if (!current) throw new NotFoundError("Order not found");

  if (!STATUS_TRANSITIONS[current.status].includes(nextStatus)) {
    throw new ConflictError(`Cannot change an order from ${current.status} to ${nextStatus}`);
  }

  const $set = { status: nextStatus };
  if (nextStatus === "COMPLETED") {
    $set.completedAt = new Date();
    // Pay-at-table/counter model: finishing the order means the bill was settled.
    $set.paymentStatus = "PAID";
  }

  // Compare-and-set on the previous status so two admins can't race each other.
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, restaurantId, status: current.status },
    { $set },
    { returnDocument: "after" }
  ).lean();
  if (!updated) throw new ConflictError("This order was just updated by someone else. Please refresh.");

  const order = serialize(updated);

  try {
    emitOrderStatusChanged(String(restaurantId), orderId, {
      orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt,
    });
    emitOrderUpdated(String(restaurantId), order);
  } catch (err) {
    console.error("[orders] failed to emit status change:", err);
  }

  return order;
}
