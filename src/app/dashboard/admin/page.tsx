import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccessCode } from "@/lib/actions/admin";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { formatDate } from "@/lib/dates";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    notFound();
  }

  const { created } = await searchParams;

  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { usedByOrganizer: { select: { name: true, email: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        ← Tus eventos
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">
        Administración de códigos de acceso
      </h1>

      {created && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-success/30 bg-success-bg p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-success">Código creado</p>
            <p className="font-serif text-xl font-medium text-ink">{created}</p>
          </div>
          <CopyLinkButton url={created} label="Copiar código" />
        </div>
      )}

      <section className="mt-6 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">Generar código nuevo</h2>
        <form action={createAccessCode} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Tipo de plan
            </label>
            <select
              name="accountType"
              className="rounded-lg border border-gold/25 px-3 py-2 text-sm"
            >
              <option value="INDIVIDUAL">Particular (1 evento)</option>
              <option value="PLANNER">Wedding Planner (ilimitado)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Etiqueta (opcional)
            </label>
            <input
              name="label"
              placeholder="Venta IG - Juan Pérez"
              className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white shadow-md shadow-gold/30 hover:shadow-lg"
          >
            Generar
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          Códigos generados ({codes.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gold/20 bg-white/60 shadow-md backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Etiqueta</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t border-gold/15">
                  <td className="px-4 py-2 font-mono">{c.code}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {c.accountType === "PLANNER" ? "Wedding Planner" : "Particular"}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{c.label || "—"}</td>
                  <td className="px-4 py-2">
                    {c.usedAt ? (
                      <span className="text-warning">
                        Usado por {c.usedByOrganizer?.name} ({c.usedByOrganizer?.email}) ·{" "}
                        {formatDate(c.usedAt, "medium")}
                      </span>
                    ) : (
                      <span className="text-success">Sin usar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
