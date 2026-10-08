import Link from "next/link";

const FEATURES = [
  { icon: "📱", title: "QR table ordering", text: "Every table gets its own QR code. Guests scan, browse the menu and order from their phone. No app, no login." },
  { icon: "⚡", title: "Real-time order management", text: "New orders appear on the admin dashboard the instant they are placed. Accept, prepare and complete with one tap." },
  { icon: "🍛", title: "Your restaurant, your menu", text: "Manage categories, dishes, prices, tables and taxes yourself. Built to serve many restaurants from one system." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-lg font-bold text-ink">
          <span className="text-primary">QR</span> Ordering
        </span>
        <Link href="/admin/login" className="text-sm font-medium text-ink hover:text-primary">
          Admin login
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5">
        <section className="py-16 text-center sm:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">QR Ordering System</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">Scan. Order. Serve.</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Create a modern ordering experience for your restaurant. Guests order from their table, your team sees it live.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/admin/login" className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark sm:w-auto">
              Admin Login
            </Link>
            <Link href="/table/1" className="w-full rounded-lg border border-line bg-white px-6 py-3 font-medium text-ink transition-colors hover:bg-primary-soft sm:w-auto">
              View Demo Menu
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-line bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl" aria-hidden>{f.icon}</div>
              <h2 className="mb-1 font-semibold text-ink">{f.title}</h2>
              <p className="text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">QR Ordering System</footer>
    </div>
  );
}
