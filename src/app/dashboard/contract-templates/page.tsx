import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { createContractTemplate, deleteContractTemplate } from "@/lib/actions/contractTemplates";

export default async function ContractTemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "crm_contracts")) {
    notFound();
  }

  const templates = await prisma.contractTemplate.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/dashboard/leads" className="text-sm text-gold-dark hover:underline">
        ← Leads
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">Plantillas de contrato</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Guarda textos base (términos y condiciones estándar) para no reescribirlos en cada contrato
        nuevo.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Crear plantilla</h2>
        <form
          action={createContractTemplate}
          className="space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input
              name="name"
              required
              placeholder="Contrato estándar de boda"
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Contenido</label>
            <textarea
              name="content"
              required
              rows={6}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            Crear
          </button>
        </form>
      </section>

      <section className="mt-8 space-y-2">
        {templates.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no creaste ninguna plantilla.</p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
            >
              <div>
                <p className="font-medium text-ink">{template.name}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-ink-muted">
                  {template.content.length > 200
                    ? `${template.content.slice(0, 200)}…`
                    : template.content}
                </p>
              </div>
              <form action={deleteContractTemplate.bind(null, template.id)}>
                <button type="submit" className="text-sm text-danger hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
