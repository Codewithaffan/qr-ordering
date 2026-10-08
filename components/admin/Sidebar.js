"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/menu", label: "Menu", icon: "🍴" },
  { href: "/admin/tables", label: "Tables", icon: "⬚" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar({ restaurantName, newOrders = 0, onNavigate, onLogout, loggingOut }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">QR Ordering</p>
        <p className="mt-0.5 truncate text-base font-bold text-ink">{restaurantName}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary-soft text-primary-dark" : "text-ink hover:bg-cream"
              }`}
            >
              <span className="w-5 text-center" aria-hidden>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/orders" && newOrders > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{newOrders}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-50"
        >
          <span className="w-5 text-center" aria-hidden>⏻</span>
          {loggingOut ? "Signing out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
