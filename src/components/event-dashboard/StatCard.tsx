export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gold/20 bg-white/60 p-4 text-center shadow-md backdrop-blur-xl">
      <p className="font-serif text-3xl font-medium">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
