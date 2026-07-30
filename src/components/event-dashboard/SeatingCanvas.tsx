"use client";

import { useState, useTransition, type DragEvent, type PointerEvent } from "react";
import type { Guest, Table as TableModel, TableShape } from "@prisma/client";
import {
  createTable,
  updateTableDetails,
  updateTablePosition,
  deleteTable,
  assignGuestToTable,
} from "@/lib/actions/tables";
import { calcTableOccupancy } from "@/lib/tables";

type DragState = {
  tableId: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

function shapeStyle(shape: TableShape, seats: number): React.CSSProperties {
  if (shape === "RECT") {
    const width = Math.min(260, 140 + seats * 8);
    return { width, minHeight: 110, borderRadius: "0.75rem" };
  }
  const size = Math.min(180, 90 + seats * 5);
  return { width: size, minHeight: size, borderRadius: "9999px" };
}

function guestLabel(guest: Guest): string {
  const extra = guest.status === "CONFIRMED" ? guest.companionsConfirmed ?? 0 : guest.maxCompanions;
  return extra > 0 ? `${guest.name} (+${extra})` : guest.name;
}

export function SeatingCanvas({
  eventId,
  initialTables,
  initialGuests,
}: {
  eventId: string;
  initialTables: TableModel[];
  initialGuests: Guest[];
}) {
  const [tables, setTables] = useState(initialTables);
  const [prevInitialTables, setPrevInitialTables] = useState(initialTables);
  if (initialTables !== prevInitialTables) {
    setPrevInitialTables(initialTables);
    setTables(initialTables);
  }

  const [guests, setGuests] = useState(initialGuests);
  const [prevInitialGuests, setPrevInitialGuests] = useState(initialGuests);
  if (initialGuests !== prevInitialGuests) {
    setPrevInitialGuests(initialGuests);
    setGuests(initialGuests);
  }

  const [drag, setDrag] = useState<DragState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const unassigned = guests.filter((g) => g.tableId == null);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>, table: TableModel) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      tableId: table.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: table.x,
      originY: table.y,
    });
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const nextX = Math.max(0, drag.originX + (e.clientX - drag.startX));
    const nextY = Math.max(0, drag.originY + (e.clientY - drag.startY));
    setTables((prev) => prev.map((t) => (t.id === drag.tableId ? { ...t, x: nextX, y: nextY } : t)));
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const tableId = drag.tableId;
    setDrag(null);
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    startTransition(() => {
      updateTablePosition(table.id, table.x, table.y).catch(() =>
        setError("No se pudo guardar la posición de la mesa")
      );
    });
  }

  function assignGuest(guestId: string, tableId: string | null) {
    const table = tableId ? tables.find((t) => t.id === tableId) : null;
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId, tableName: table?.name ?? null } : g))
    );
    startTransition(() => {
      assignGuestToTable(guestId, tableId).catch(() => setError("No se pudo asignar el invitado"));
    });
  }

  function handleDragStartGuest(e: DragEvent, guestId: string) {
    e.dataTransfer.setData("text/plain", guestId);
  }

  function handleDropOnTable(e: DragEvent, tableId: string) {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("text/plain");
    if (guestId) assignGuest(guestId, tableId);
  }

  function handleDropOnSidebar(e: DragEvent) {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("text/plain");
    if (guestId) assignGuest(guestId, null);
  }

  async function handleDeleteTable(tableId: string) {
    try {
      await deleteTable(tableId);
    } catch {
      setError("No se pudo eliminar la mesa");
    }
  }

  return (
    <div className="space-y-4 py-6">
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <details className="rounded-lg border border-gold/20 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-xl">
        <summary className="cursor-pointer text-sm font-medium">+ Agregar mesa</summary>
        <form
          action={async (formData) => {
            setError(null);
            try {
              await createTable(eventId, formData);
            } catch {
              setError("No se pudo crear la mesa");
            }
          }}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input name="name" required placeholder="Mesa 1" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Forma</label>
            <select name="shape" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm">
              <option value="ROUND">Redonda</option>
              <option value="RECT">Rectangular</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Puestos</label>
            <input
              name="seats"
              type="number"
              min={1}
              defaultValue={8}
              className="w-20 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            Agregar
          </button>
        </form>
      </details>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          className="relative flex-1 overflow-auto rounded-lg border border-gold/20 bg-white/40 shadow-md backdrop-blur-xl"
          style={{ height: 600 }}
        >
          {tables.length === 0 && (
            <p className="p-6 text-sm text-ink-muted">
              Todavía no hay mesas. Agregá la primera arriba y arrastrala para ubicarla.
            </p>
          )}
          {tables.map((table) => {
            const occupancy = calcTableOccupancy(table.id, guests);
            const overCapacity = occupancy > table.seats;
            const seated = guests.filter((g) => g.tableId === table.id);

            return (
              <div
                key={table.id}
                className={`absolute flex flex-col items-center gap-1 border-2 bg-warm/95 p-2 text-center shadow-md ${
                  overCapacity ? "border-danger/50" : "border-gold/30"
                }`}
                style={{ left: table.x, top: table.y, ...shapeStyle(table.shape, table.seats) }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnTable(e, table.id)}
              >
                <div
                  className="w-full cursor-move select-none"
                  onPointerDown={(e) => handlePointerDown(e, table)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <p className="text-sm font-medium text-ink">{table.name}</p>
                  <p className={`text-xs ${overCapacity ? "text-danger" : "text-ink-muted"}`}>
                    {occupancy}/{table.seats}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-1 overflow-y-auto px-1">
                  {seated.map((guest) => (
                    <span
                      key={guest.id}
                      draggable
                      onDragStart={(e) => handleDragStartGuest(e, guest.id)}
                      className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-ink shadow-sm"
                    >
                      {guestLabel(guest)}
                      <button
                        type="button"
                        onClick={() => assignGuest(guest.id, null)}
                        className="text-ink-muted hover:text-danger"
                        aria-label={`Quitar a ${guest.name} de la mesa`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === table.id ? null : table.id)}
                    className="text-gold-dark hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(table.id)}
                    className="text-danger hover:underline"
                  >
                    Eliminar
                  </button>
                </div>

                {editingId === table.id && (
                  <form
                    action={async (formData) => {
                      setError(null);
                      try {
                        await updateTableDetails(table.id, formData);
                        setEditingId(null);
                      } catch {
                        setError("No se pudo actualizar la mesa");
                      }
                    }}
                    className="mt-1 flex flex-col gap-1 rounded-lg border border-gold/20 bg-white p-2"
                  >
                    <input
                      name="name"
                      defaultValue={table.name}
                      className="rounded border border-gold/25 px-1.5 py-1 text-xs"
                    />
                    <select
                      name="shape"
                      defaultValue={table.shape}
                      className="rounded border border-gold/25 px-1.5 py-1 text-xs"
                    >
                      <option value="ROUND">Redonda</option>
                      <option value="RECT">Rectangular</option>
                    </select>
                    <input
                      name="seats"
                      type="number"
                      min={1}
                      defaultValue={table.seats}
                      className="rounded border border-gold/25 px-1.5 py-1 text-xs"
                    />
                    <button type="submit" className="rounded bg-gold-dark px-2 py-1 text-xs text-white">
                      Guardar
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="w-full flex-none rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl lg:w-64"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnSidebar}
        >
          <h3 className="mb-2 font-serif text-base font-medium text-ink">
            Sin mesa ({unassigned.length})
          </h3>
          <div className="space-y-2">
            {unassigned.map((guest) => (
              <div
                key={guest.id}
                draggable
                onDragStart={(e) => handleDragStartGuest(e, guest.id)}
                className="cursor-grab rounded-lg border border-gold/20 bg-white px-3 py-2 text-sm shadow-sm"
              >
                {guestLabel(guest)}
                {guest.tableName && (
                  <p className="text-[11px] text-ink-muted">mesa (texto): {guest.tableName}</p>
                )}
              </div>
            ))}
            {unassigned.length === 0 && (
              <p className="text-xs text-ink-muted">Todos los invitados tienen mesa asignada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
