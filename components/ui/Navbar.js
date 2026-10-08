/** Simple top bar: title on the left, optional actions on the right. Used by the admin top bar. */
export default function Navbar({ left, title, right, className = "" }) {
  return (
    <header className={`sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur ${className}`}>
      {left}
      {title && <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{title}</h1>}
      {!title && <div className="flex-1" />}
      {right}
    </header>
  );
}
