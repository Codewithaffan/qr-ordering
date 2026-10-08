import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, default: "", maxlength: 300 },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });
categorySchema.index({ restaurantId: 1, sortOrder: 1 });

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
