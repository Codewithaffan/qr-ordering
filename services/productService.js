import Product from "@/models/Product";
import Category from "@/models/Category";
import { serialize } from "@/utils/serialize";
import { ValidationError, NotFoundError } from "@/utils/errors";
import { resolveImageUrl } from "@/lib/imageStorage";
import {
  assertObjectId, assertPlainObject, has, requireString, optionalString, requireNumber,
  requireBoolean, requireInt,
} from "@/utils/validators";

async function assertCategoryOwned(restaurantId, categoryId) {
  assertObjectId(categoryId, "categoryId");
  const exists = await Category.exists({ _id: categoryId, restaurantId });
  if (!exists) throw new ValidationError("categoryId: category not found", { categoryId: "Category not found" });
}

export async function listProducts(restaurantId, { categoryId } = {}) {
  const filter = { restaurantId };
  if (categoryId) filter.categoryId = assertObjectId(categoryId, "categoryId");
  const products = await Product.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  return serialize(products);
}

export async function getProduct(restaurantId, id) {
  assertObjectId(id, "productId");
  const product = await Product.findOne({ _id: id, restaurantId }).lean();
  if (!product) throw new NotFoundError("Product not found");
  return serialize(product);
}

export async function createProduct(restaurantId, body) {
  assertPlainObject(body);
  await assertCategoryOwned(restaurantId, body.categoryId);

  const data = {
    name: requireString(body.name, "name", { max: 100 }),
    description: optionalString(body.description, "description", { max: 500 }),
    price: requireNumber(body.price, "price", { min: 0, max: 1000000, maxDecimals: 2 }),
    image: resolveImageUrl(body.image),
    categoryId: body.categoryId,
    restaurantId,
    isAvailable: has(body, "isAvailable") ? requireBoolean(body.isAvailable, "isAvailable") : true,
    isFeatured: has(body, "isFeatured") ? requireBoolean(body.isFeatured, "isFeatured") : false,
  };

  if (has(body, "sortOrder")) {
    data.sortOrder = requireInt(body.sortOrder, "sortOrder", { min: 0, max: 100000 });
  } else {
    const last = await Product.findOne({ restaurantId, categoryId: data.categoryId }).sort({ sortOrder: -1 }).select("sortOrder").lean();
    data.sortOrder = (last?.sortOrder ?? 0) + 1;
  }

  return serialize((await Product.create(data)).toObject());
}

export async function updateProduct(restaurantId, id, body) {
  assertObjectId(id, "productId");
  assertPlainObject(body);
  const $set = {};

  if (has(body, "name")) $set.name = requireString(body.name, "name", { max: 100 });
  if (has(body, "description")) $set.description = optionalString(body.description, "description", { max: 500 });
  if (has(body, "price")) $set.price = requireNumber(body.price, "price", { min: 0, max: 1000000, maxDecimals: 2 });
  if (has(body, "image")) $set.image = resolveImageUrl(body.image);
  if (has(body, "isAvailable")) $set.isAvailable = requireBoolean(body.isAvailable, "isAvailable");
  if (has(body, "isFeatured")) $set.isFeatured = requireBoolean(body.isFeatured, "isFeatured");
  if (has(body, "sortOrder")) $set.sortOrder = requireInt(body.sortOrder, "sortOrder", { min: 0, max: 100000 });
  if (has(body, "categoryId")) {
    await assertCategoryOwned(restaurantId, body.categoryId);
    $set.categoryId = body.categoryId;
  }

  const updated = await Product.findOneAndUpdate({ _id: id, restaurantId }, { $set }, { returnDocument: "after", runValidators: true }).lean();
  if (!updated) throw new NotFoundError("Product not found");
  return serialize(updated);
}

export async function deleteProduct(restaurantId, id) {
  assertObjectId(id, "productId");
  const result = await Product.deleteOne({ _id: id, restaurantId });
  if (result.deletedCount === 0) throw new NotFoundError("Product not found");
  // Past orders keep their own copy of name + price, so nothing else needs cleaning up.
  return { id };
}
