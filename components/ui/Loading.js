export function Spinner({ className = "h-5 w-5" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-primary border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export default function Loading({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
