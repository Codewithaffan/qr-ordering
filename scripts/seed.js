// Idempotent seed: safe to run any number of times.
//   npm run seed
//   npm run seed -- --reset-admin-password   (re-hash ADMIN_PASSWORD onto the existing admin)
import dotenv from "dotenv";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import Admin from "../models/Admin.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Table from "../models/Table.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import { hashPassword } from "../utils/password.js";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
const ADMIN_NAME = process.env.ADMIN_NAME || "Restaurant Admin";
const RESTAURANT_NAME = process.env.SEED_RESTAURANT_NAME || "ABC Restaurant";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const resetPassword = process.argv.includes("--reset-admin-password");

function requireEnv() {
  const missing = ["MONGODB_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`✖ Missing environment variable(s): ${missing.join(", ")} (set them in .env.local)`);
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("✖ ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
}

const CATALOG = [
  { name: "Starters", description: "Light bites to begin with", products: [
    { name: "Paneer Tikka", description: "Char-grilled cottage cheese marinated in spices", price: 240, isFeatured: true },
    { name: "Veg Spring Rolls", description: "Crispy rolls with seasoned vegetables", price: 180 },
    { name: "Chicken 65", description: "Spicy fried chicken with curry leaves", price: 260 },
  ]},
  { name: "Main Course", description: "Hearty curries and mains", products: [
    { name: "Butter Chicken", description: "Tandoori chicken in a creamy tomato gravy", price: 340, isFeatured: true },
    { name: "Paneer Butter Masala", description: "Cottage cheese in rich buttery gravy", price: 290 },
    { name: "Dal Makhani", description: "Slow-cooked black lentils with cream", price: 240 },
    { name: "Veg Burger", description: "Crispy veg patty, cheese and fresh salad", price: 180 },
  ]},
  { name: "Breads", description: "Fresh from the tandoor", products: [
    { name: "Butter Naan", description: "Soft leavened bread brushed with butter", price: 60 },
    { name: "Garlic Naan", description: "Naan topped with garlic and coriander", price: 75 },
    { name: "Tandoori Roti", description: "Whole wheat bread baked in the tandoor", price: 30 },
  ]},
  { name: "Rice", description: "Biryanis and rice bowls", products: [
    { name: "Chicken Biryani", description: "Fragrant basmati layered with spiced chicken", price: 280, isFeatured: true },
    { name: "Veg Biryani", description: "Basmati rice with vegetables and saffron", price: 240 },
    { name: "Jeera Rice", description: "Basmati tempered with cumin", price: 150 },
  ]},
  { name: "Drinks", description: "Cold and hot beverages", products: [
    { name: "Coke", description: "Chilled 300 ml", price: 60 },
    { name: "Fresh Lime Soda", description: "Sweet or salted", price: 80 },
    { name: "Masala Chai", description: "Indian spiced tea", price: 50 },
  ]},
  { name: "Desserts", description: "Something sweet", products: [
    { name: "Gulab Jamun", description: "Warm milk dumplings in rose syrup (2 pcs)", price: 90, isFeatured: true },
    { name: "Vanilla Ice Cream", description: "Two scoops", price: 100 },
    { name: "Chocolate Brownie", description: "Warm brownie with chocolate sauce", price: 140 },
  ]},
];

async function seedRestaurant() {
  let restaurant = await Restaurant.findOne({ name: RESTAURANT_NAME });
  if (restaurant) {
    console.log(`• Restaurant "${RESTAURANT_NAME}" already exists`);
    return restaurant;
  }
  restaurant = await Restaurant.create({
    name: RESTAURANT_NAME,
    email: "hello@abc-restaurant.example",
    phone: "+91 98765 43210",
    address: "12 MG Road, Mumbai, Maharashtra",
    settings: { currency: "INR", taxPercentage: 5, serviceChargePercentage: 5 },
  });
  console.log(`✓ Created restaurant "${RESTAURANT_NAME}"`);
  return restaurant;
}

async function seedAdmin(restaurant) {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await Admin.findOne({ email });
  if (existing) {
    if (resetPassword) {
      existing.password = await hashPassword(ADMIN_PASSWORD);
      await existing.save();
      console.log(`✓ Reset password for admin ${email}`);
    } else {
      console.log(`• Admin ${email} already exists (use --reset-admin-password to change the password)`);
    }
    return;
  }
  await Admin.create({
    name: ADMIN_NAME,
    email,
    password: await hashPassword(ADMIN_PASSWORD),
    restaurantId: restaurant._id,
    role: "ADMIN",
  });
  console.log(`✓ Created admin ${email}`);
}

async function seedTables(restaurant) {
  let created = 0;
  for (let n = 1; n <= 5; n++) {
    if (await Table.exists({ restaurantId: restaurant._id, tableNumber: n })) continue;
    const _id = new mongoose.Types.ObjectId();
    await Table.create({
      _id,
      restaurantId: restaurant._id,
      tableNumber: n,
      qrCode: `QR-${String(_id).slice(-6).toUpperCase()}`,
      qrUrl: `${APP_URL}/table/${_id}`,
    });
    created++;
  }
  console.log(created ? `✓ Created ${created} table(s)` : "• Tables 1-5 already exist");
}

async function seedMenu(restaurant) {
  let cats = 0;
  let prods = 0;
  for (const [index, entry] of CATALOG.entries()) {
    let category = await Category.findOne({ restaurantId: restaurant._id, name: entry.name });
    if (!category) {
      category = await Category.create({
        name: entry.name, description: entry.description, restaurantId: restaurant._id, sortOrder: index + 1,
      });
      cats++;
    }
    for (const [pIndex, p] of entry.products.entries()) {
      if (await Product.exists({ restaurantId: restaurant._id, name: p.name })) continue;
      await Product.create({ ...p, categoryId: category._id, restaurantId: restaurant._id, sortOrder: pIndex + 1 });
      prods++;
    }
  }
  console.log(cats || prods ? `✓ Created ${cats} categorie(s) and ${prods} product(s)` : "• Menu already seeded");
}

async function main() {
  requireEnv();
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Make sure unique indexes exist before inserting (prevents duplicates on concurrent/repeated runs).
  await Promise.all([Restaurant, Admin, Category, Product, Table, Order, Counter].map((m) => m.init()));

  const restaurant = await seedRestaurant();
  await seedAdmin(restaurant);
  await seedTables(restaurant);
  await seedMenu(restaurant);

  console.log(`\nDone. Log in at ${APP_URL}/admin/login with ${ADMIN_EMAIL.trim().toLowerCase()}`);
}

main()
  .catch((err) => {
    console.error("✖ Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
