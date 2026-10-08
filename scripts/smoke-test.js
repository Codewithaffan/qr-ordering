// End-to-end smoke test against a RUNNING server (npm run dev) + seeded database.
//   npm run test:smoke
// Uses ADMIN_EMAIL / ADMIN_PASSWORD from .env.local and NEXT_PUBLIC_APP_URL (default http://localhost:3000).
// It creates a few clearly-named test records (category "ZZ Smoke ...") and cleans them up.
import dotenv from "dotenv";
import { io } from "socket.io-client";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const BASE = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

let passed = 0;
let failed = 0;
function check(name, condition, extra = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} ${extra}`);
  }
}
const section = (t) => console.log(`\n${t}`);

let cookie = "";
async function call(method, path, body, { auth = true, raw = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(auth && cookie ? { cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  let json = null;
  try { json = await res.json(); } catch { /* not json */ }
  return { status: res.status, json, data: json?.data, headers: res.headers };
}

const waitFor = (socket, event, ms = 4000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for "${event}"`)), ms);
    socket.once(event, (payload) => { clearTimeout(t); resolve(payload); });
  });
const connect = (socket) => new Promise((res, rej) => { socket.once("connect", res); socket.once("connect_error", rej); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");
  console.log(`Smoke testing ${BASE}`);

  section("1. Database + unauthorized access");
  check("GET /api/test-db connects to MongoDB", (await call("GET", "/api/test-db", undefined, { auth: false })).json?.success === true);
  for (const p of ["/api/products", "/api/categories", "/api/tables", "/api/orders/admin", "/api/settings", "/api/dashboard/stats", "/api/auth/me", "/api/restaurants"]) {
    const r = await call("GET", p, undefined, { auth: false });
    check(`GET ${p} without login -> 401`, r.status === 401, `(got ${r.status})`);
  }
  check("PATCH order status without login -> 401", (await call("PATCH", "/api/orders/64b7f0f0f0f0f0f0f0f0f0f0/status", { status: "ACCEPTED" }, { auth: false })).status === 401);
  check("POST /api/products without login -> 401", (await call("POST", "/api/products", { name: "x" }, { auth: false })).status === 401);
  const pageRes = await call("GET", "/admin/dashboard", undefined, { auth: false, raw: true });
  const noFollow = await fetch(`${BASE}/admin/dashboard`, { redirect: "manual" });
  check("/admin/dashboard without login redirects to /admin/login", [307, 308].includes(noFollow.status) && (noFollow.headers.get("location") || "").includes("/admin/login"), `(got ${noFollow.status} ${noFollow.headers.get("location")})`);
  void pageRes;

  section("2. Admin authentication");
  const bad = await call("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: "definitely-wrong" }, { auth: false });
  check("wrong password -> 401", bad.status === 401);
  const badEmail = await call("POST", "/api/auth/login", { email: "nobody@example.com", password: "whatever12" }, { auth: false });
  check("unknown email -> 401 with same message", badEmail.status === 401 && badEmail.json.message === bad.json.message);
  check("malformed email -> 400", (await call("POST", "/api/auth/login", { email: "nope", password: "x" }, { auth: false })).status === 400);
  const login = await call("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { auth: false });
  check("valid login -> 200", login.status === 200, JSON.stringify(login.json));
  const setCookie = login.headers.get("set-cookie") || "";
  check("auth cookie is HttpOnly + SameSite=Lax", /httponly/i.test(setCookie) && /samesite=lax/i.test(setCookie), setCookie);
  check("login response contains no token / password", !JSON.stringify(login.json).match(/token|password|\$2[aby]\$/i));
  cookie = setCookie.split(";")[0];
  const me = await call("GET", "/api/auth/me");
  check("GET /api/auth/me returns admin + restaurant", me.status === 200 && me.data?.admin?.email === ADMIN_EMAIL && !!me.data?.restaurant?.name);
  check("me never exposes password hash", !JSON.stringify(me.json).match(/\$2[aby]\$|"password"/));
  const restaurantId = me.data.admin.restaurantId;
  const forbidden = await call("GET", "/api/restaurants/64b7f0f0f0f0f0f0f0f0f0f0");
  check("reading another restaurant -> 403", forbidden.status === 403);
  const adminPage = await fetch(`${BASE}/admin/dashboard`, { headers: { cookie }, redirect: "manual" });
  check("/admin/dashboard with login -> 200", adminPage.status === 200, `(got ${adminPage.status})`);

  section("3. Menu management (categories / products / tables)");
  const cat = await call("POST", "/api/categories", { name: "ZZ Smoke Category", description: "temp" });
  check("create category -> 201", cat.status === 201, JSON.stringify(cat.json));
  check("duplicate category -> 409", (await call("POST", "/api/categories", { name: "ZZ Smoke Category" })).status === 409);
  check("category without name -> 400", (await call("POST", "/api/categories", { description: "x" })).status === 400);
  const prod = await call("POST", "/api/products", { name: "ZZ Smoke Dish", description: "temp", price: 199.5, categoryId: cat.data._id, image: "https://example.com/x.jpg", isFeatured: true });
  check("create product -> 201", prod.status === 201, JSON.stringify(prod.json));
  check("negative price -> 400", (await call("POST", "/api/products", { name: "Bad", price: -5, categoryId: cat.data._id })).status === 400);
  check("bad category id -> 400", (await call("POST", "/api/products", { name: "Bad", price: 5, categoryId: "nope" })).status === 400);
  check("javascript: image URL -> 400", (await call("POST", "/api/products", { name: "Bad", price: 5, categoryId: cat.data._id, image: "javascript:alert(1)" })).status === 400);
  const upd = await call("PATCH", `/api/products/${prod.data._id}`, { price: 210, isAvailable: true });
  check("update product price", upd.status === 200 && upd.data.price === 210);
  check("delete non-empty category -> 409", (await call("DELETE", `/api/categories/${cat.data._id}`)).status === 409);

  const tablesBefore = (await call("GET", "/api/tables")).data;
  const nextNo = Math.max(0, ...tablesBefore.map((t) => t.tableNumber)) + 1;
  const table = await call("POST", "/api/tables", { tableNumber: nextNo });
  check("create table -> 201 with qrUrl", table.status === 201 && table.data.qrUrl === `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/table/${table.data._id}`, JSON.stringify(table.json));
  check("duplicate table number -> 409", (await call("POST", "/api/tables", { tableNumber: nextNo })).status === 409);
  const qr = await call("GET", `/api/tables/${table.data._id}/qr`, undefined, { raw: true });
  const png = Buffer.from(await qr.arrayBuffer());
  check("QR endpoint returns a PNG", qr.status === 200 && png.subarray(1, 4).toString() === "PNG", `(status ${qr.status})`);
  const qrDl = await call("GET", `/api/tables/${table.data._id}/qr?download=1`, undefined, { raw: true });
  check("QR download has attachment header", /attachment/.test(qrDl.headers.get("content-disposition") || ""));

  section("4. Customer menu");
  const seededTable = tablesBefore.find((t) => t.tableNumber === 1) || tablesBefore[0];
  const menuById = await call("GET", `/api/menu/${seededTable._id}`, undefined, { auth: false });
  check("public menu by table id", menuById.status === 200 && menuById.data.categories.length > 0 && menuById.data.restaurant.name);
  check("public menu leaks no restaurant email/phone", !JSON.stringify(menuById.json).match(/"email"|"phone"/));
  const menuByNo = await call("GET", "/api/menu/1", undefined, { auth: false });
  check("public menu via /table/1 style number", menuByNo.status === 200);
  check("unknown table -> 404", (await call("GET", "/api/menu/64b7f0f0f0f0f0f0f0f0f0f0", undefined, { auth: false })).status === 404);
  check("garbage table -> 404", (await call("GET", "/api/menu/abc", undefined, { auth: false })).status === 404);

  section("5. Real-time + order flow");
  const adminSocket = io(BASE, { extraHeaders: { cookie }, transports: ["websocket"] });
  const anonSocket = io(BASE, { transports: ["websocket"] });
  const strangerSocket = io(BASE, { transports: ["websocket"] });
  await Promise.all([connect(adminSocket), connect(anonSocket), connect(strangerSocket)]);
  check("sockets connected (admin via cookie, customers anonymous)", true);

  const allProducts = menuById.data.categories.flatMap((c) => c.products);
  const p1 = allProducts.find((p) => p.name === "Coke") || allProducts[0];
  const p2 = allProducts.find((p) => p.name === "Butter Naan") || allProducts[1];
  const tax = me.data.restaurant.settings.taxPercentage;
  const svc = me.data.restaurant.settings.serviceChargePercentage;

  const newOrderEvent = waitFor(adminSocket, "new-order");
  const strangerNoNew = new Promise((res) => { strangerSocket.once("new-order", () => res(false)); setTimeout(() => res(true), 1500); });
  const orderRes = await call("POST", "/api/orders", {
    tableId: seededTable._id,
    items: [{ productId: p1._id, quantity: 2 }, { productId: p2._id, quantity: 1, price: 1, name: "HACKED" }],
    // attempts to tamper - all must be ignored by the server:
    totalAmount: 1, subtotal: 1, price: 1,
    customerName: "Smoke Tester", customerPhone: "+91 98765 43210", customerNote: "no onions",
  }, { auth: false });
  check("place order -> 201", orderRes.status === 201, JSON.stringify(orderRes.json));
  const order = orderRes.data;
  const expectedSubtotal = p1.price * 2 + p2.price;
  const expectedTax = Math.round(expectedSubtotal * tax) / 100;
  const expectedSvc = Math.round(expectedSubtotal * svc) / 100;
  check(`server-computed subtotal = ${expectedSubtotal}`, order.subtotal === expectedSubtotal, `(got ${order.subtotal})`);
  check(`server-computed tax (${tax}%) = ${expectedTax}`, Math.abs(order.taxAmount - expectedTax) < 0.011, `(got ${order.taxAmount})`);
  check(`server-computed service charge (${svc}%) = ${expectedSvc}`, Math.abs(order.serviceCharge - expectedSvc) < 0.011, `(got ${order.serviceCharge})`);
  check("total = subtotal + tax + service (client total ignored)", Math.abs(order.totalAmount - (expectedSubtotal + expectedTax + expectedSvc)) < 0.011 && order.totalAmount !== 1, `(got ${order.totalAmount})`);
  check("item names/prices copied from DB (tampering ignored)", order.items.every((i) => i.name !== "HACKED" && i.price !== 1));
  check("order number is human friendly (ORD-####)", /^ORD-\d{4,}$/.test(order.orderNumber), order.orderNumber);
  check("customer response hides phone number", !("customerPhone" in order));
  check("initial status NEW / payment PENDING", order.status === "NEW" && order.paymentStatus === "PENDING");

  let ev = null;
  try { ev = await newOrderEvent; } catch (e) { check("admin received new-order", false, e.message); }
  if (ev) {
    check("admin received 'new-order' instantly (no refresh)", ev.orderNumber === order.orderNumber && ev.tableNumber === seededTable.tableNumber);
    check("admin event carries items + total", ev.items?.length === 2 && ev.totalAmount === order.totalAmount);
  }
  check("admin-only event NOT delivered to other sockets", await strangerNoNew);

  section("6. Order validation");
  const post = (b) => call("POST", "/api/orders", { tableId: seededTable._id, ...b }, { auth: false });
  check("empty cart -> 400", (await post({ items: [] })).status === 400);
  check("quantity 0 -> 400", (await post({ items: [{ productId: p1._id, quantity: 0 }] })).status === 400);
  check("quantity 1000 -> 400", (await post({ items: [{ productId: p1._id, quantity: 1000 }] })).status === 400);
  check("fractional quantity -> 400", (await post({ items: [{ productId: p1._id, quantity: 1.5 }] })).status === 400);
  check("invalid product id -> 400", (await post({ items: [{ productId: "zzz", quantity: 1 }] })).status === 400);
  check("nonexistent product -> 400", (await post({ items: [{ productId: "64b7f0f0f0f0f0f0f0f0f0f0", quantity: 1 }] })).status === 400);
  check("invalid phone -> 400", (await post({ items: [{ productId: p1._id, quantity: 1 }], customerPhone: "abc" })).status === 400);
  check("invalid table id -> 400", (await call("POST", "/api/orders", { tableId: "x", items: [{ productId: p1._id, quantity: 1 }] }, { auth: false })).status === 400);
  check("non-JSON body -> 400", (await fetch(`${BASE}/api/orders`, { method: "POST", body: "not json", headers: { "Content-Type": "application/json" } })).status === 400);
  await call("PATCH", `/api/products/${prod.data._id}`, { isAvailable: false });
  const unavailable = await post({ items: [{ productId: prod.data._id, quantity: 1 }] });
  check("unavailable product -> 409", unavailable.status === 409, JSON.stringify(unavailable.json));
  await call("PATCH", `/api/tables/${table.data._id}`, { isActive: false });
  check("inactive table -> 403", (await call("POST", "/api/orders", { tableId: table.data._id, items: [{ productId: p1._id, quantity: 1 }] }, { auth: false })).status === 403);
  check("inactive table menu -> 403", (await call("GET", `/api/menu/${table.data._id}`, undefined, { auth: false })).status === 403);

  section("7. Customer tracking + status updates (real-time)");
  const pub = await call("GET", `/api/orders/${order._id}`, undefined, { auth: false });
  check("public order tracking works without login", pub.status === 200 && pub.data.orderNumber === order.orderNumber && !("customerPhone" in pub.data));
  anonSocket.emit("join-order", order._id);
  await sleep(300);

  const statusForCustomer = waitFor(anonSocket, "order-status-changed");
  const statusForAdmin = waitFor(adminSocket, "order-status-changed");
  const updatedForAdmin = waitFor(adminSocket, "order-updated");
  const strangerNoStatus = new Promise((res) => { strangerSocket.once("order-status-changed", () => res(false)); setTimeout(() => res(true), 1500); });
  const acc = await call("PATCH", `/api/orders/${order._id}/status`, { status: "ACCEPTED" });
  check("admin ACCEPTED -> 200", acc.status === 200 && acc.data.status === "ACCEPTED", JSON.stringify(acc.json));
  try {
    const c = await statusForCustomer;
    check("customer got 'order-status-changed' in real time", c.status === "ACCEPTED" && c.orderId === order._id);
  } catch (e) { check("customer got 'order-status-changed'", false, e.message); }
  try { check("admin got 'order-status-changed'", (await statusForAdmin).status === "ACCEPTED"); } catch (e) { check("admin got 'order-status-changed'", false, e.message); }
  try { check("admin got 'order-updated'", (await updatedForAdmin).orderNumber === order.orderNumber); } catch (e) { check("admin got 'order-updated'", false, e.message); }
  check("unrelated customer did NOT receive this order's status", await strangerNoStatus);

  check("invalid transition ACCEPTED -> COMPLETED -> 409", (await call("PATCH", `/api/orders/${order._id}/status`, { status: "COMPLETED" })).status === 409);
  check("unknown status -> 400", (await call("PATCH", `/api/orders/${order._id}/status`, { status: "EATEN" })).status === 400);

  const before = (await call("GET", "/api/dashboard/stats")).data;
  for (const s of ["PREPARING", "READY", "COMPLETED"]) {
    const r = await call("PATCH", `/api/orders/${order._id}/status`, { status: s });
    check(`-> ${s}`, r.status === 200 && r.data.status === s);
  }
  const done = (await call("GET", `/api/orders/${order._id}`, undefined, { auth: false })).data;
  check("COMPLETED marks paymentStatus PAID", done.status === "COMPLETED" && done.paymentStatus === "PAID");
  check("cannot change a COMPLETED order -> 409", (await call("PATCH", `/api/orders/${order._id}/status`, { status: "CANCELLED" })).status === 409);

  section("8. Dashboard statistics");
  const after = (await call("GET", "/api/dashboard/stats")).data;
  check("stats have all fields", ["todayRevenue", "monthRevenue", "todayOrders", "pendingOrders"].every((k) => typeof after[k] === "number"), JSON.stringify(after));
  check("today revenue increased by the completed order total", Math.abs(after.todayRevenue - before.todayRevenue - order.totalAmount) < 0.011, `(before ${before.todayRevenue}, after ${after.todayRevenue}, total ${order.totalAmount})`);
  check("month revenue >= today revenue", after.monthRevenue >= after.todayRevenue);
  check("pending count dropped after completion", after.pendingOrders === before.pendingOrders - 1, `(before ${before.pendingOrders}, after ${after.pendingOrders})`);

  const o2 = (await post({ items: [{ productId: p1._id, quantity: 1 }] })).data;
  const beforeCancel = (await call("GET", "/api/dashboard/stats")).data;
  await call("PATCH", `/api/orders/${o2._id}/status`, { status: "CANCELLED" });
  const afterCancel = (await call("GET", "/api/dashboard/stats")).data;
  check("cancelled order never adds revenue", afterCancel.todayRevenue === beforeCancel.todayRevenue);
  const list = await call("GET", "/api/orders/admin?limit=5");
  check("admin order list returns newest first", list.status === 200 && list.data.orders.length > 0 && new Date(list.data.orders[0].createdAt) >= new Date(list.data.orders.at(-1).createdAt));
  check("admin list filter by status", (await call("GET", "/api/orders/admin?status=COMPLETED")).data.orders.every((o) => o.status === "COMPLETED"));
  check("bad status filter -> 400", (await call("GET", "/api/orders/admin?status=BOGUS")).status === 400);

  section("9. Settings");
  const settings = await call("GET", "/api/settings");
  const orig = settings.data;
  const put = await call("PUT", "/api/settings", { name: orig.name, taxPercentage: 12.5, serviceChargePercentage: 0, currency: "inr" });
  check("update settings", put.status === 200 && put.data.settings.taxPercentage === 12.5 && put.data.settings.currency === "INR", JSON.stringify(put.json));
  check("tax > 100 -> 400", (await call("PUT", "/api/settings", { taxPercentage: 150 })).status === 400);
  check("invalid email -> 400", (await call("PUT", "/api/settings", { email: "nope" })).status === 400);
  await call("PUT", "/api/settings", { taxPercentage: tax, serviceChargePercentage: svc });

  section("10. Cleanup + logout");
  check("delete product", (await call("DELETE", `/api/products/${prod.data._id}`)).status === 200);
  check("delete category", (await call("DELETE", `/api/categories/${cat.data._id}`)).status === 200);
  check("delete table", (await call("DELETE", `/api/tables/${table.data._id}`)).status === 200);
  check("delete unknown table -> 404", (await call("DELETE", `/api/tables/${table.data._id}`)).status === 404);
  adminSocket.close(); anonSocket.close(); strangerSocket.close();

  const out = await call("POST", "/api/auth/logout", {});
  check("logout -> 200 and cookie cleared", out.status === 200 && /max-age=0|expires=/i.test(out.headers.get("set-cookie") || ""));
  const staleCookie = cookie;
  cookie = "";
  check("after logout /api/auth/me -> 401", (await call("GET", "/api/auth/me")).status === 401);
  void staleCookie;
  void restaurantId;
}

main()
  .catch((err) => {
    failed++;
    console.error("\nTest run aborted:", err.message);
  })
  .finally(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  });
