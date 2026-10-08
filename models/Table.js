import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, min: 1 },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    // Short human-readable reference (printed on the QR sticker). The QR IMAGE is generated
    // on demand and is never stored in the database.
    qrCode: { type: String, required: true },
    // The URL encoded in the QR code: ${NEXT_PUBLIC_APP_URL}/table/{tableId}
    qrUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Table numbers are unique per restaurant.
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);

export default Table;
