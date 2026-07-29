export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gold/20 bg-white p-4 text-center">
      <p className="font-serif text-3xl font-medium">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
