import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getCurrentAdmin } from "@/middleware/auth";

export const metadata = { title: "Admin login" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Real check (not just "has a cookie"): a disabled admin with a stale cookie must see the form.
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <LoginForm />
    </main>
  );
}
