import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/middleware/auth";
import { getRestaurant } from "@/services/restaurantService";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const restaurant = await getRestaurant(admin.restaurantId);

  return (
    <AdminShell admin={admin} restaurant={{ id: restaurant._id, name: restaurant.name, logo: restaurant.logo, currency: restaurant.settings?.currency || "INR" }}>
      {children}
    </AdminShell>
  );
}
