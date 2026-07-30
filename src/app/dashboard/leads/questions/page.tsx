import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import {
  createLeadQuestion,
  deleteLeadQuestion,
  moveLeadQuestion,
  toggleLeadIntakeForm,
} from "@/lib/actions/leadQuestions";

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "Texto corto",
  TEXTAREA: "Texto largo",
  NUMBER: "Número",
};

export default async function LeadQuestionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "crm_leads")) {
    notFound();
  }

  const organizer = await prisma.organizer.findUniqueOrThrow({ where: { id: session.user.id } });
  const questions = await prisma.leadQuestion.findMany({
    where: { organizerId: session.user.id },
    orderBy: { order: "asc" },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/dashboard/leads" className="text-sm text-gold-dark hover:underline">
        ← Leads
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">Cuestionario de cotización</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Arma las preguntas que verán quienes te pidan una cotización. El formulario público crea un
        lead nuevo automáticamente.
      </p>

      <section className="mt-6 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <p className="font-medium text-ink">Link público</p>
        {organizer.leadIntakeToken ? (
          <div className="mt-2 flex items-center gap-3">
            <CopyLinkButton url={`${baseUrl}/quote/${organizer.leadIntakeToken}`} />
            <form action={toggleLeadIntakeForm}>
              <input type="hidden" name="enable" value="false" />
              <button type="submit" className="text-sm text-danger hover:underline">
                Desactivar
              </button>
            </form>
          </div>
        ) : (
          <form action={toggleLeadIntakeForm} className="mt-2">
            <input type="hidden" name="enable" value="true" />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Activar link público
            </button>
          </form>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Agregar pregunta</h2>
        <form
          action={createLeadQuestion}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Pregunta</label>
            <input
              name="label"
              required
              placeholder="Ej. ¿Cuántos invitados esperan?"
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tipo</label>
            <select
              name="fieldType"
              defaultValue="TEXT"
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            >
              <option value="TEXT">Texto corto</option>
              <option value="TEXTAREA">Texto largo</option>
              <option value="NUMBER">Número</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input name="required" type="checkbox" className="h-4 w-4" />
            Obligatoria
          </label>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            Agregar
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          Tus preguntas ({questions.length})
        </h2>
        {questions.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no agregaste preguntas.</p>
        ) : (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-3 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {question.label}
                    {question.required && <span className="text-danger"> *</span>}
                  </p>
                  <p className="text-xs text-ink-muted">{FIELD_TYPE_LABELS[question.fieldType]}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <form action={moveLeadQuestion.bind(null, question.id, "up")}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      className="rounded border border-gold/25 px-2 py-1 text-xs hover:bg-warm disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveLeadQuestion.bind(null, question.id, "down")}>
                    <button
                      type="submit"
                      disabled={index === questions.length - 1}
                      className="rounded border border-gold/25 px-2 py-1 text-xs hover:bg-warm disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={deleteLeadQuestion.bind(null, question.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
