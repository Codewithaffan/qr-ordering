export function formatMoney(amount, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${formatTime(iso)}`;
}
