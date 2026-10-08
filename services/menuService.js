import Category from "@/models/Category";
import Product from "@/models/Product";
import { serialize } from "@/utils/serialize";
import { resolveCustomerTable } from "@/services/tableService";
import { toPublicRestaurant } from "@/services/restaurantService";

/** Public menu for a table: active categories with their products (unavailable ones flagged). */
export async function getMenuForTable(tableParam) {
  const { table, restaurant } = await resolveCustomerTable(tableParam);

  const [categories, products] = await Promise.all([
    Category.find({ restaurantId: restaurant._id, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.find({ restaurantId: restaurant._id }).sort({ sortOrder: 1, name: 1 }).lean(),
  ]);

  const byCategory = new Map();
  for (const p of products) {
    const key = String(p.categoryId);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push({
      _id: String(p._id),
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
    });
  }

  return serialize({
    restaurant: toPublicRestaurant(restaurant),
    table: { _id: String(table._id), tableNumber: table.tableNumber },
    categories: categories
      .map((c) => ({
        _id: String(c._id),
        name: c.name,
        description: c.description,
        products: byCategory.get(String(c._id)) || [],
      }))
      .filter((c) => c.products.length > 0),
  });
}
