import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { createLead } from "@/lib/actions/leads";

const STAGE_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUOTED: "Cotizado",
  WON: "Ganado",
  LOST: "Perdido",
};

const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-warm text-ink-muted",
  CONTACTED: "bg-gold/15 text-gold-dark",
  QUOTED: "bg-blue-100 text-blue-700",
  WON: "bg-success-bg text-success",
  LOST: "bg-danger-bg text-danger",
};

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "crm_leads")) {
    notFound();
  }

  const leads = await prisma.lead.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        ← Tus eventos
      </Link>

      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-medium text-ink">Leads</h1>
        <Link href="/dashboard/leads/questions" className="text-sm text-gold-dark hover:underline">
          Cuestionario de cotización →
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Prospectos y clientes potenciales, con su etapa en el proceso de venta.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Agregar lead</h2>
        <form
          action={createLead}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input name="name" required className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
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
            Agregar
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Tus leads ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no agregaste ningún lead.</p>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition hover:border-gold/40 hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-ink">
                    {lead.name}
                    {lead.convertedEventId && (
                      <span className="ml-2 rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                        Convertido en evento
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {lead.phone || ""} {lead.email ? `· ${lead.email}` : ""}
                  </p>
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_STYLES[lead.stage]}`}
                >
                  {STAGE_LABELS[lead.stage]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
