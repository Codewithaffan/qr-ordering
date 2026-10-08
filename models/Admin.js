import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // bcrypt hash only. Never selected by default, never returned by any API.
    password: { type: String, required: true, select: false },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    role: { type: String, enum: ["ADMIN"], default: "ADMIN" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
