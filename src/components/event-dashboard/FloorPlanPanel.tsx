import { FloorPlanUploadForm } from "@/components/event-dashboard/FloorPlanUploadForm";
import { FloorPlanEditor } from "@/components/event-dashboard/FloorPlanEditor";
import type { FloorPlanShape } from "@/components/event-dashboard/FloorPlanEditorInner";

export function FloorPlanPanel({
  eventId,
  hasImage,
  floorPlanData,
}: {
  eventId: string;
  hasImage: boolean;
  floorPlanData: unknown;
}) {
  const initialShapes: FloorPlanShape[] = Array.isArray(floorPlanData) ? (floorPlanData as FloorPlanShape[]) : [];

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg text-ink">Plano del salón</h2>
        <p className="text-sm text-ink-muted">
          Sube una imagen o PDF del salón como referencia y dibuja las zonas (mesas, pista, barra, entrada, etc.).
        </p>
      </div>
      <FloorPlanUploadForm eventId={eventId} hasImage={hasImage} />
      <FloorPlanEditor eventId={eventId} hasImage={hasImage} initialShapes={initialShapes} />
    </div>
  );
}
