export default function Card({ children, className = "", padded = true, ...props }) {
  return (
    <div className={`rounded-xl border border-line bg-white shadow-sm ${padded ? "p-5" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}
