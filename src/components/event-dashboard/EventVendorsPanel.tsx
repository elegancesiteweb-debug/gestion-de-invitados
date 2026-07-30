import Link from "next/link";
import type { EventVendor, Vendor } from "@prisma/client";
import {
  assignVendorToEvent,
  unassignVendorFromEvent,
  createVendorForEvent,
} from "@/lib/actions/vendors";

type EventVendorWithVendor = EventVendor & { vendor: Vendor };

export function EventVendorsPanel({
  eventId,
  eventVendors,
  availableVendors,
}: {
  eventId: string;
  eventVendors: EventVendorWithVendor[];
  availableVendors: Vendor[];
}) {
  const assignedIds = new Set(eventVendors.map((ev) => ev.vendorId));
  const unassigned = availableVendors.filter((v) => !assignedIds.has(v.id));

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          Proveedores de este evento
        </h2>
        {eventVendors.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Todavía no agregaste proveedores a este evento.
          </p>
        ) : (
          <div className="space-y-2">
            {eventVendors.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="font-medium text-ink">
                    {ev.vendor.name}
                    {ev.vendor.category && (
                      <span className="ml-2 rounded-full bg-warm px-2 py-0.5 text-xs text-ink-muted">
                        {ev.vendor.category}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {ev.vendor.phone || ""} {ev.vendor.email ? `· ${ev.vendor.email}` : ""}
                  </p>
                </div>
                <form action={unassignVendorFromEvent.bind(null, eventId, ev.vendorId)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    Quitar
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {unassigned.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">
            Agregar de tu directorio
          </h2>
          <form
            action={assignVendorToEvent.bind(null, eventId)}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Proveedor</label>
              <select
                name="vendorId"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              >
                {unassigned.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.category ? ` (${v.category})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Agregar
            </button>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Nuevo proveedor</h2>
        <form
          action={createVendorForEvent.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input name="name" required className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Categoría</label>
            <input
              name="category"
              placeholder="Ej. Catering"
              className="w-36 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Teléfono</label>
            <input name="phone" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input name="email" type="email" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Notas</label>
            <input name="notes" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            Crear y agregar
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">
          Este proveedor también quedará guardado en tu{" "}
          <Link href="/dashboard/vendors" className="text-gold-dark hover:underline">
            directorio general
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
