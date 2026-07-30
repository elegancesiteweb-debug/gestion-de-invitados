"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Text } from "react-konva";
import type Konva from "konva";
import { saveFloorPlanData } from "@/lib/actions/floorPlan";

export type FloorPlanShape = {
  id: string;
  type: "freehand" | "rect" | "circle" | "text";
  label?: string;
  color: string;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
};

type Tool = "select" | "pencil" | "rect" | "circle" | "text";

const COLORS = ["#B8935F", "#7c9885", "#5b7c99", "#c97b63", "#8a6bbd", "#333333"];

const TEMPLATES: { name: string; shapes: Omit<FloorPlanShape, "id">[] }[] = [
  {
    name: "Salón rectangular",
    shapes: [
      { type: "rect", label: "Zona de mesas", color: "#7c9885", x: 40, y: 40, width: 400, height: 260 },
      { type: "circle", label: "Pista de baile", color: "#5b7c99", x: 540, y: 170, radius: 80 },
      { type: "rect", label: "Barra", color: "#c97b63", x: 480, y: 320, width: 160, height: 60 },
    ],
  },
  {
    name: "Ceremonia + recepción",
    shapes: [
      { type: "rect", label: "Ceremonia", color: "#8a6bbd", x: 40, y: 40, width: 250, height: 200 },
      { type: "rect", label: "Recepción / mesas", color: "#7c9885", x: 320, y: 40, width: 340, height: 300 },
      { type: "circle", label: "Pista de baile", color: "#5b7c99", x: 490, y: 220, radius: 60 },
    ],
  },
  {
    name: "Salón en U",
    shapes: [
      { type: "rect", label: "Mesa principal", color: "#B8935F", x: 200, y: 30, width: 300, height: 50 },
      { type: "rect", label: "Mesas laterales izq.", color: "#7c9885", x: 40, y: 100, width: 100, height: 300 },
      { type: "rect", label: "Mesas laterales der.", color: "#7c9885", x: 560, y: 100, width: 100, height: 300 },
      { type: "circle", label: "Pista de baile", color: "#5b7c99", x: 350, y: 260, radius: 90 },
    ],
  },
];

const STAGE_WIDTH = 700;
const STAGE_HEIGHT = 500;

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `shape-${Date.now()}-${idCounter}`;
}

export function FloorPlanEditorInner({
  eventId,
  hasImage,
  initialShapes,
}: {
  eventId: string;
  hasImage: boolean;
  initialShapes: FloorPlanShape[];
}) {
  const [shapes, setShapes] = useState<FloorPlanShape[]>(initialShapes);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState(COLORS[0]);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const drawingRef = useRef<FloorPlanShape | null>(null);
  const [drawingShape, setDrawingShape] = useState<FloorPlanShape | null>(null);

  useEffect(() => {
    if (!hasImage) return;
    let cancelled = false;
    const img = new window.Image();
    img.src = `/api/events/${eventId}/floor-plan-image`;
    img.onload = () => {
      if (!cancelled) setBgImage(img);
    };
    return () => {
      cancelled = true;
      setBgImage(null);
    };
  }, [eventId, hasImage]);

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (tool === "select") return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    if (tool === "text") {
      const label = window.prompt("Texto de la etiqueta:");
      if (label) {
        setShapes((prev) => [...prev, { id: nextId(), type: "text", label, color, x: pos.x, y: pos.y }]);
      }
      return;
    }

    const shape: FloorPlanShape = {
      id: nextId(),
      type: tool === "pencil" ? "freehand" : tool === "rect" ? "rect" : "circle",
      color,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
      points: tool === "pencil" ? [pos.x, pos.y] : undefined,
    };
    drawingRef.current = shape;
    setDrawingShape(shape);
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!drawingRef.current) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    const current = drawingRef.current;

    if (current.type === "freehand") {
      current.points = [...(current.points ?? []), pos.x, pos.y];
    } else if (current.type === "rect") {
      current.width = pos.x - (current.x ?? 0);
      current.height = pos.y - (current.y ?? 0);
    } else if (current.type === "circle") {
      const dx = pos.x - (current.x ?? 0);
      const dy = pos.y - (current.y ?? 0);
      current.radius = Math.sqrt(dx * dx + dy * dy);
    }
    setDrawingShape({ ...current });
  }

  function handleMouseUp() {
    const current = drawingRef.current;
    drawingRef.current = null;
    setDrawingShape(null);
    if (!current) return;

    if (current.type === "freehand" && (current.points?.length ?? 0) < 4) return;
    if (current.type === "rect" && (!current.width || Math.abs(current.width) < 5)) return;
    if (current.type === "circle" && (!current.radius || current.radius < 5)) return;

    const label = window.prompt("Etiqueta para esta zona (opcional):") ?? undefined;
    setShapes((prev) => [...prev, { ...current, label: label || undefined }]);
  }

  function applyTemplate(templateName: string) {
    const template = TEMPLATES.find((t) => t.name === templateName);
    if (!template) return;
    if (shapes.length > 0 && !window.confirm("Esto reemplaza el diseño actual. ¿Continuar?")) return;
    setShapes(template.shapes.map((s) => ({ ...s, id: nextId() })));
  }

  function undo() {
    setShapes((prev) => prev.slice(0, -1));
  }

  function clearAll() {
    if (shapes.length > 0 && !window.confirm("¿Borrar todas las formas?")) return;
    setShapes([]);
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg(null);
    const formData = new FormData();
    formData.set("data", JSON.stringify(shapes));
    try {
      await saveFloorPlanData(eventId, formData);
      setSavedMsg("Guardado");
    } catch {
      setSavedMsg("No se pudo guardar");
    }
    setSaving(false);
  }

  const allShapes = drawingShape ? [...shapes, drawingShape] : shapes;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gold/20 bg-white/60 p-3 shadow-sm backdrop-blur-xl">
        <ToolButton active={tool === "select"} onClick={() => setTool("select")}>
          Seleccionar
        </ToolButton>
        <ToolButton active={tool === "pencil"} onClick={() => setTool("pencil")}>
          ✏️ Lápiz
        </ToolButton>
        <ToolButton active={tool === "rect"} onClick={() => setTool("rect")}>
          ▭ Rectángulo
        </ToolButton>
        <ToolButton active={tool === "circle"} onClick={() => setTool("circle")}>
          ◯ Círculo
        </ToolButton>
        <ToolButton active={tool === "text"} onClick={() => setTool("text")}>
          🔤 Texto
        </ToolButton>

        <div className="mx-2 flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-ink" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        <select
          onChange={(e) => {
            if (e.target.value) applyTemplate(e.target.value);
            e.target.value = "";
          }}
          defaultValue=""
          className="rounded-lg border border-gold/30 px-2 py-1 text-sm"
        >
          <option value="">Plantilla…</option>
          {TEMPLATES.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={undo}
          className="rounded-lg border border-gold/30 px-3 py-1 text-sm hover:bg-warm"
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-danger/30 px-3 py-1 text-sm text-danger hover:bg-danger-bg"
        >
          Limpiar
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ml-auto rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar diseño"}
        </button>
        {savedMsg && <span className="text-sm text-ink-muted">{savedMsg}</span>}
      </div>

      <div className="overflow-auto rounded-lg border border-gold/20 bg-white shadow-md">
        <Stage
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={tool !== "select" ? "cursor-crosshair" : ""}
        >
          <Layer>
            {bgImage && <KonvaImage image={bgImage} width={STAGE_WIDTH} height={STAGE_HEIGHT} opacity={0.85} />}
            {allShapes.map((shape) => (
              <ShapeRenderer key={shape.id} shape={shape} />
            ))}
          </Layer>
        </Stage>
      </div>
      <p className="text-xs text-ink-muted">
        Elige una herramienta, dibuja sobre el lienzo y ponle una etiqueta a cada zona. No olvides
        &quot;Guardar diseño&quot;.
      </p>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1 text-sm ${
        active ? "border-gold bg-warm text-gold-dark" : "border-gold/30 text-ink-muted hover:bg-warm"
      }`}
    >
      {children}
    </button>
  );
}

function ShapeRenderer({ shape }: { shape: FloorPlanShape }) {
  if (shape.type === "freehand") {
    return (
      <>
        <Line
          points={shape.points ?? []}
          stroke={shape.color}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          tension={0.3}
        />
        {shape.label && shape.points && shape.points.length >= 2 && (
          <Text x={shape.points[0]} y={shape.points[1] - 16} text={shape.label} fontSize={13} fill={shape.color} />
        )}
      </>
    );
  }
  if (shape.type === "rect") {
    const width = shape.width ?? 0;
    const height = shape.height ?? 0;
    const x = width < 0 ? (shape.x ?? 0) + width : shape.x ?? 0;
    const y = height < 0 ? (shape.y ?? 0) + height : shape.y ?? 0;
    return (
      <>
        <Rect
          x={x}
          y={y}
          width={Math.abs(width)}
          height={Math.abs(height)}
          stroke={shape.color}
          strokeWidth={2}
          fill={`${shape.color}33`}
          cornerRadius={4}
        />
        {shape.label && <Text x={x + 4} y={y + 4} text={shape.label} fontSize={13} fill={shape.color} />}
      </>
    );
  }
  if (shape.type === "circle") {
    const radius = shape.radius ?? 0;
    return (
      <>
        <Circle x={shape.x ?? 0} y={shape.y ?? 0} radius={radius} stroke={shape.color} strokeWidth={2} fill={`${shape.color}33`} />
        {shape.label && (
          <Text
            x={(shape.x ?? 0) - radius}
            y={(shape.y ?? 0) - 8}
            text={shape.label}
            fontSize={13}
            fill={shape.color}
            align="center"
            width={radius * 2}
          />
        )}
      </>
    );
  }
  return <Text x={shape.x ?? 0} y={shape.y ?? 0} text={shape.label ?? ""} fontSize={15} fill={shape.color} fontStyle="bold" />;
}
