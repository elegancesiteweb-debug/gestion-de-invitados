export function BrandHeader({
  organizer,
}: {
  organizer: { id: string; brandLogoType: string | null; brandName: string | null };
}) {
  if (!organizer.brandLogoType && !organizer.brandName) return null;

  return (
    <div className="mb-3 flex items-center justify-center gap-2">
      {organizer.brandLogoType && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/organizers/${organizer.id}/brand-logo`}
          alt=""
          className="h-8 w-8 rounded-full object-cover"
        />
      )}
      {organizer.brandName && (
        <span className="text-sm font-medium text-ink-muted">{organizer.brandName}</span>
      )}
    </div>
  );
}
