import Card from "@/components/ui/Card";

export default function StatCard({ label, value, hint, tone = "default" }) {
  return (
    <Card className={tone === "highlight" ? "border-primary/40 bg-primary-soft/50" : ""}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
