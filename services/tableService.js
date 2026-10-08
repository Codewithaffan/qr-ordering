import mongoose from "mongoose";
import QRCode from "qrcode";
import Table from "@/models/Table";
import Restaurant from "@/models/Restaurant";
import { serialize } from "@/utils/serialize";
import { buildTableUrl } from "@/utils/url";
import { rethrowDuplicate } from "@/utils/dbErrors";
import { ConflictError, ForbiddenError, NotFoundError } from "@/utils/errors";
import { assertObjectId, assertPlainObject, has, isObjectId, requireBoolean, requireInt } from "@/utils/validators";

const qrReference = (id) => `QR-${String(id).slice(-6).toUpperCase()}`;

export async function listTables(restaurantId) {
  return serialize(await Table.find({ restaurantId }).sort({ tableNumber: 1 }).lean());
}

export async function createTable(restaurantId, body) {
  assertPlainObject(body);

  let tableNumber;
  if (has(body, "tableNumber") && body.tableNumber !== "" && body.tableNumber !== null) {
    tableNumber = requireInt(body.tableNumber, "tableNumber", { min: 1, max: 9999 });
  } else {
    const last = await Table.findOne({ restaurantId }).sort({ tableNumber: -1 }).select("tableNumber").lean();
    tableNumber = (last?.tableNumber ?? 0) + 1;
  }

  // The QR URL contains the table's own id, so allocate the id up front.
  const _id = new mongoose.Types.ObjectId();
  try {
    const table = await Table.create({
      _id,
      restaurantId,
      tableNumber,
      qrCode: qrReference(_id),
      qrUrl: buildTableUrl(_id),
    });
    return serialize(table.toObject());
  } catch (err) {
    rethrowDuplicate(err, `Table ${tableNumber} already exists`);
  }
}

export async function updateTable(restaurantId, id, body) {
  assertObjectId(id, "tableId");
  assertPlainObject(body);
  const $set = {};
  if (has(body, "isActive")) $set.isActive = requireBoolean(body.isActive, "isActive");
  if (has(body, "tableNumber")) $set.tableNumber = requireInt(body.tableNumber, "tableNumber", { min: 1, max: 9999 });

  try {
    const updated = await Table.findOneAndUpdate({ _id: id, restaurantId }, { $set }, { returnDocument: "after", runValidators: true }).lean();
    if (!updated) throw new NotFoundError("Table not found");
    return serialize(updated);
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    rethrowDuplicate(err, "That table number already exists");
  }
}

export async function deleteTable(restaurantId, id) {
  assertObjectId(id, "tableId");
  const result = await Table.deleteOne({ _id: id, restaurantId });
  if (result.deletedCount === 0) throw new NotFoundError("Table not found");
  // Orders keep their own tableNumber, so history stays intact.
  return { id };
}

/** Generates the QR PNG on demand (never stored). Also refreshes qrUrl if NEXT_PUBLIC_APP_URL changed. */
export async function getTableQrPng(restaurantId, id, { width = 640 } = {}) {
  assertObjectId(id, "tableId");
  const table = await Table.findOne({ _id: id, restaurantId }).lean();
  if (!table) throw new NotFoundError("Table not found");

  const url = buildTableUrl(table._id);
  if (table.qrUrl !== url) {
    await Table.updateOne({ _id: table._id }, { $set: { qrUrl: url } });
  }

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: Math.min(Math.max(width, 200), 1200),
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#1F2937", light: "#FFFFFF" },
  });
  return { png, tableNumber: table.tableNumber, url };
}

/**
 * Resolve the :tableId segment of /table/:tableId for customers.
 *  - 24-hex ObjectId  -> canonical, works for any number of restaurants (this is what QR codes contain)
 *  - small integer    -> convenience for demos ("/table/1"); only unambiguous while exactly one
 *                        restaurant has that table number.
 * Returns { table, restaurant } (lean docs) or throws 404/403/409.
 */
export async function resolveCustomerTable(param) {
  let table;

  if (isObjectId(param)) {
    table = await Table.findById(param).lean();
  } else if (/^\d{1,4}$/.test(String(param))) {
    const matches = await Table.find({ tableNumber: Number(param), isActive: true }).limit(2).lean();
    if (matches.length > 1) {
      throw new ConflictError("Several restaurants use this table number. Please scan the QR code on your table.");
    }
    table = matches[0];
  }

  if (!table) throw new NotFoundError("Table not found. Please scan the QR code on your table again.");
  if (!table.isActive) throw new ForbiddenError("This table is not accepting orders right now.");

  const restaurant = await Restaurant.findById(table.restaurantId).lean();
  if (!restaurant || !restaurant.isActive) throw new NotFoundError("This restaurant is not accepting orders right now.");

  return { table, restaurant };
}
