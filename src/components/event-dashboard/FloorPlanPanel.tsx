import { getTranslations } from "next-intl/server";
import { FloorPlanUploadForm } from "@/components/event-dashboard/FloorPlanUploadForm";
import { FloorPlanEditor } from "@/components/event-dashboard/FloorPlanEditor";
import type { FloorPlanShape } from "@/components/event-dashboard/FloorPlanEditorInner";

export async function FloorPlanPanel({
  eventId,
  hasImage,
  floorPlanData,
}: {
  eventId: string;
  hasImage: boolean;
  floorPlanData: unknown;
}) {
  const t = await getTranslations("floorPlan");
  const initialShapes: FloorPlanShape[] = Array.isArray(floorPlanData) ? (floorPlanData as FloorPlanShape[]) : [];

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg text-ink">{t("title")}</h2>
        <p className="text-sm text-ink-muted">{t("subtitle")}</p>
      </div>
      <FloorPlanUploadForm eventId={eventId} hasImage={hasImage} />
      <FloorPlanEditor eventId={eventId} hasImage={hasImage} initialShapes={initialShapes} />
    </div>
  );
}
