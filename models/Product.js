import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: "", maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ restaurantId: 1, categoryId: 1, sortOrder: 1 });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
