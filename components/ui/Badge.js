const TONES = {
  gray: "bg-gray-100 text-gray-700",
  orange: "bg-orange-100 text-orange-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-700",
};

export default function Badge({ tone = "gray", children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

const STATUS_TONE = {
  NEW: "orange",
  ACCEPTED: "blue",
  PREPARING: "amber",
  READY: "green",
  COMPLETED: "gray",
  CANCELLED: "red",
};

export function OrderStatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || "gray"}>{status}</Badge>;
}
