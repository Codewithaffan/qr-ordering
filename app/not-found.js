import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="text-5xl" aria-hidden>🍽️</div>
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
      <p className="max-w-sm text-muted">The page you are looking for doesn&apos;t exist. If you scanned a QR code, please scan it again.</p>
      <Link href="/" className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
        Back to home
      </Link>
    </main>
  );
}
