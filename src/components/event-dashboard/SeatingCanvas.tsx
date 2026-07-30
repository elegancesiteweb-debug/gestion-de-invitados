"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent, type PointerEvent } from "react";
import type { Companion, Guest, Table as TableModel, TableShape } from "@prisma/client";
import {
  createTable,
  updateTableDetails,
  updateTablePosition,
  deleteTable,
  assignGuestToTable,
} from "@/lib/actions/tables";
import { calcTableOccupancy, buildSeatOccupants } from "@/lib/tables";

type GuestWithCompanions = Guest & { companions: Companion[] };

type DragState = {
  tableId: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const SEAT_MARGIN = 26;
const PARTY_ROW_HEIGHT = 32;

function shapeDimensions(shape: TableShape, seats: number): { width: number; height: number } {
  if (shape === "RECT") {
    return { width: Math.min(260, 140 + seats * 8), height: 110 };
  }
  const size = Math.min(180, 90 + seats * 5);
  return { width: size, height: size };
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
  initialGuests: GuestWithCompanions[];
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
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement>(null);

  const unassigned = guests.filter((g) => g.tableId == null);
  const selectedGuest = guests.find((g) => g.id === selectedGuestId) ?? null;

  // Al abrir la pestaña, si las mesas quedaron ubicadas fuera de lo que entra en
  // una pantalla angosta (por ejemplo, se acomodaron en una pantalla grande),
  // centramos la vista en ellas en vez de dejar el lienzo mostrando una esquina vacía.
  useEffect(() => {
    if (!canvasRef.current || tables.length === 0) return;
    const minX = Math.min(...tables.map((t) => t.x));
    const minY = Math.min(...tables.map((t) => t.y));
    canvasRef.current.scrollTo({ left: Math.max(0, minX - 100), top: Math.max(0, minY - 100) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelectGuest(e: { stopPropagation: () => void }, guestId: string) {
    e.stopPropagation();
    setSelectedGuestId((prev) => (prev === guestId ? null : guestId));
  }

  function handleTableTap(tableId: string) {
    if (!selectedGuestId) return;
    assignGuest(selectedGuestId, tableId);
    setSelectedGuestId(null);
  }

  function handleSidebarTap() {
    if (!selectedGuestId) return;
    assignGuest(selectedGuestId, null);
    setSelectedGuestId(null);
  }

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

      {selectedGuest && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg border border-gold/30 bg-warm px-3 py-2 text-sm text-ink">
          Invitado seleccionado: <span className="font-medium">{selectedGuest.name}</span> — tocá
          una mesa para asignarlo (o el panel &quot;Sin mesa&quot; para quitarlo).
          <button
            type="button"
            onClick={() => setSelectedGuestId(null)}
            className="text-gold-dark hover:underline"
          >
            Cancelar
          </button>
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

      {tables.length > 0 && (
        <p className="text-xs text-ink-muted lg:hidden">
          Deslizá dentro del recuadro para ver todas tus mesas — tocá un invitado y después una
          mesa para asignarlo.
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          ref={canvasRef}
          className="relative h-[420px] flex-1 overflow-auto rounded-lg border border-gold/20 bg-white/40 shadow-md backdrop-blur-xl sm:h-[520px] lg:h-[640px]"
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
            const { width, height } = shapeDimensions(table.shape, table.seats);

            const editForm = editingId === table.id && (
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
                className="absolute z-10 flex flex-col gap-1 rounded-lg border border-gold/20 bg-white p-2 shadow-lg"
                style={{ left: 0, top: table.shape === "RECT" ? height + 4 : width + 2 * SEAT_MARGIN }}
                onClick={(e) => e.stopPropagation()}
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
            );

            if (table.shape === "ROUND") {
              const wrapperWidth = width + 2 * SEAT_MARGIN;
              const circleCenter = SEAT_MARGIN + width / 2;
              const wrapperHeight = width + 2 * SEAT_MARGIN + PARTY_ROW_HEIGHT;
              const seatRadius = width / 2 + 20;
              const occupants = buildSeatOccupants(table.id, guests);

              return (
                <div
                  key={table.id}
                  className="absolute"
                  style={{
                    left: table.x - circleCenter,
                    top: table.y - circleCenter,
                    width: wrapperWidth,
                    height: wrapperHeight,
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnTable(e, table.id)}
                  onClick={() => handleTableTap(table.id)}
                >
                  <div
                    className={`absolute flex cursor-move select-none flex-col items-center justify-center rounded-full border-2 bg-warm/95 text-center shadow-md ${
                      overCapacity ? "border-danger/50" : "border-gold/30"
                    }`}
                    style={{ left: SEAT_MARGIN, top: SEAT_MARGIN, width, height: width }}
                    onPointerDown={(e) => handlePointerDown(e, table)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    <p className="text-sm font-medium text-ink">{table.name}</p>
                    <p className={`text-xs ${overCapacity ? "text-danger" : "text-ink-muted"}`}>
                      {occupancy}/{table.seats}
                    </p>
                    <div className="mt-1 flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(editingId === table.id ? null : table.id);
                        }}
                        className="text-gold-dark hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table.id);
                        }}
                        className="text-danger hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {Array.from({ length: table.seats }, (_, i) => {
                    const angle = (2 * Math.PI * i) / table.seats - Math.PI / 2;
                    const seatX = circleCenter + seatRadius * Math.cos(angle);
                    const seatY = circleCenter + seatRadius * Math.sin(angle);
                    return (
                      <div
                        key={i}
                        className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] text-ink shadow-sm"
                        style={{ left: seatX, top: seatY }}
                      >
                        {occupants[i] ?? ""}
                      </div>
                    );
                  })}

                  <div
                    className="absolute flex flex-wrap justify-center gap-1 px-1"
                    style={{ left: 0, top: 2 * SEAT_MARGIN + width, width: wrapperWidth }}
                  >
                    {seated.map((guest) => (
                      <span
                        key={guest.id}
                        draggable
                        onDragStart={(e) => handleDragStartGuest(e, guest.id)}
                        onClick={(e) => toggleSelectGuest(e, guest.id)}
                        className={`flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-ink shadow-sm ${
                          selectedGuestId === guest.id ? "ring-2 ring-gold" : ""
                        }`}
                      >
                        {guestLabel(guest)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            assignGuest(guest.id, null);
                          }}
                          className="text-ink-muted hover:text-danger"
                          aria-label={`Quitar a ${guest.name} de la mesa`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {editForm}
                </div>
              );
            }

            return (
              <div
                key={table.id}
                className={`absolute flex flex-col items-center gap-1 rounded-xl border-2 bg-warm/95 p-2 text-center shadow-md ${
                  overCapacity ? "border-danger/50" : "border-gold/30"
                }`}
                style={{ left: table.x - width / 2, top: table.y - height / 2, width, height }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnTable(e, table.id)}
                onClick={() => handleTableTap(table.id)}
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
                      onClick={(e) => toggleSelectGuest(e, guest.id)}
                      className={`flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-ink shadow-sm ${
                        selectedGuestId === guest.id ? "ring-2 ring-gold" : ""
                      }`}
                    >
                      {guestLabel(guest)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          assignGuest(guest.id, null);
                        }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(editingId === table.id ? null : table.id);
                    }}
                    className="text-gold-dark hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(table.id);
                    }}
                    className="text-danger hover:underline"
                  >
                    Eliminar
                  </button>
                </div>

                {editForm}
              </div>
            );
          })}
        </div>

        <div
          className="w-full flex-none rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl lg:w-64"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnSidebar}
          onClick={handleSidebarTap}
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
                onClick={(e) => toggleSelectGuest(e, guest.id)}
                className={`cursor-grab rounded-lg border border-gold/20 bg-white px-3 py-2 text-sm shadow-sm ${
                  selectedGuestId === guest.id ? "ring-2 ring-gold" : ""
                }`}
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
