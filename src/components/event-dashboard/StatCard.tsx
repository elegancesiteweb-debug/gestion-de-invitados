export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
