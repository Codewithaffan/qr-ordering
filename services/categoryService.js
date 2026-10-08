import Category from "@/models/Category";
import Product from "@/models/Product";
import mongoose from "mongoose";
import { serialize } from "@/utils/serialize";
import { rethrowDuplicate } from "@/utils/dbErrors";
import { ConflictError, NotFoundError } from "@/utils/errors";
import {
  assertObjectId, assertPlainObject, has, requireString, optionalString, requireBoolean, requireInt,
} from "@/utils/validators";

export async function listCategories(restaurantId) {
  const [categories, counts] = await Promise.all([
    Category.find({ restaurantId }).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return serialize(categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) || 0 })));
}

export async function createCategory(restaurantId, body) {
  assertPlainObject(body);
  const data = {
    name: requireString(body.name, "name", { max: 60 }),
    description: optionalString(body.description, "description", { max: 300 }),
    isActive: has(body, "isActive") ? requireBoolean(body.isActive, "isActive") : true,
    restaurantId,
  };

  if (has(body, "sortOrder")) {
    data.sortOrder = requireInt(body.sortOrder, "sortOrder", { min: 0, max: 100000 });
  } else {
    const last = await Category.findOne({ restaurantId }).sort({ sortOrder: -1 }).select("sortOrder").lean();
    data.sortOrder = (last?.sortOrder ?? 0) + 1;
  }

  try {
    return serialize((await Category.create(data)).toObject());
  } catch (err) {
    rethrowDuplicate(err, `A category named "${data.name}" already exists`);
  }
}

export async function updateCategory(restaurantId, id, body) {
  assertObjectId(id, "categoryId");
  assertPlainObject(body);
  const $set = {};
  if (has(body, "name")) $set.name = requireString(body.name, "name", { max: 60 });
  if (has(body, "description")) $set.description = optionalString(body.description, "description", { max: 300 });
  if (has(body, "isActive")) $set.isActive = requireBoolean(body.isActive, "isActive");
  if (has(body, "sortOrder")) $set.sortOrder = requireInt(body.sortOrder, "sortOrder", { min: 0, max: 100000 });

  try {
    const updated = await Category.findOneAndUpdate({ _id: id, restaurantId }, { $set }, { returnDocument: "after", runValidators: true }).lean();
    if (!updated) throw new NotFoundError("Category not found");
    return serialize(updated);
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    rethrowDuplicate(err, "A category with that name already exists");
  }
}

export async function deleteCategory(restaurantId, id) {
  assertObjectId(id, "categoryId");
  const category = await Category.findOne({ _id: id, restaurantId }).lean();
  if (!category) throw new NotFoundError("Category not found");

  const productCount = await Product.countDocuments({ restaurantId, categoryId: id });
  if (productCount > 0) {
    throw new ConflictError(
      `"${category.name}" still has ${productCount} product${productCount === 1 ? "" : "s"}. Move or delete them first.`
    );
  }
  await Category.deleteOne({ _id: id, restaurantId });
  return { id };
}
