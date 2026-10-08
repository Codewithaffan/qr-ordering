import mongoose from "mongoose";

const ORDER_STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];

// Name and price are COPIED from the product at order time so old orders never change
// when the menu changes.
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    tableNumber: { type: Number, required: true },

    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },

    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    serviceCharge: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ORDER_STATUSES, default: "NEW" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },

    customerName: { type: String, trim: true, default: "" },
    customerPhone: { type: String, trim: true, default: "" },
    customerNote: { type: String, trim: true, default: "" },

    // Set when the order is COMPLETED. Revenue reports bucket by this date.
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, status: 1, completedAt: 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
