import connectDB from "@/lib/mongodb";
import { getAuthToken } from "@/lib/auth";
import { verifyAdminToken } from "@/lib/token";
import { getActiveAdmin } from "@/services/authService";
import { UnauthorizedError } from "@/utils/errors";

/** Reads the HTTP-only cookie, verifies it and confirms the admin is still active. Returns null if not signed in. */
export async function getCurrentAdmin() {
  await connectDB();
  const token = await getAuthToken();
  const session = await verifyAdminToken(token);
  if (!session) return null;
  return getActiveAdmin(session.adminId, session.restaurantId);
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}
