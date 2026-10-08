import Admin from "@/models/Admin";
import Restaurant from "@/models/Restaurant";
import { signAdminToken } from "@/lib/token";
import { hashPassword, verifyPassword } from "@/utils/password";
import { requireEmail, assertPlainObject } from "@/utils/validators";
import { UnauthorizedError, ValidationError } from "@/utils/errors";

let dummyHashPromise;
/** Compared against when the email is unknown so response time doesn't reveal which emails exist. */
function getDummyHash() {
  dummyHashPromise ||= hashPassword("not-a-real-password");
  return dummyHashPromise;
}

export function toSessionAdmin(admin) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    restaurantId: String(admin.restaurantId),
  };
}

export async function login(body) {
  assertPlainObject(body);
  const email = requireEmail(body.email);
  const password = body.password;
  if (typeof password !== "string" || password.length === 0 || password.length > 200) {
    throw new ValidationError("password: is required", { password: "is required" });
  }

  const admin = await Admin.findOne({ email }).select("+password").lean();
  const passwordOk = await verifyPassword(password, admin?.password || (await getDummyHash()));

  if (!admin || !passwordOk || !admin.isActive) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const restaurant = await Restaurant.findById(admin.restaurantId).select("isActive").lean();
  if (!restaurant || !restaurant.isActive) {
    throw new UnauthorizedError("This restaurant account is disabled");
  }

  const token = await signAdminToken({
    adminId: admin._id,
    restaurantId: admin.restaurantId,
    role: admin.role,
  });

  return { token, admin: toSessionAdmin(admin) };
}

/** Loads the admin behind a verified token and makes sure the account is still enabled. */
export async function getActiveAdmin(adminId, restaurantId) {
  const admin = await Admin.findOne({ _id: adminId, restaurantId, isActive: true }).lean();
  if (!admin) return null;
  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true }).select("_id").lean();
  if (!restaurant) return null;
  return toSessionAdmin(admin);
}
