"use client";

import dynamic from "next/dynamic";
import type { FloorPlanShape } from "./FloorPlanEditorInner";

const FloorPlanEditorInner = dynamic(
  () => import("./FloorPlanEditorInner").then((mod) => mod.FloorPlanEditorInner),
  {
    ssr: false,
    loading: () => (
      <p className="rounded-lg border border-gold/20 bg-white/60 p-4 text-sm text-ink-muted">
        Cargando editor del plano...
      </p>
    ),
  }
);

export function FloorPlanEditor(props: { eventId: string; hasImage: boolean; initialShapes: FloorPlanShape[] }) {
  return <FloorPlanEditorInner {...props} />;
}
