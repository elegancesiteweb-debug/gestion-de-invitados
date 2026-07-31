import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { BrandHeader } from "@/components/BrandHeader";
import { BrandFooter } from "@/components/BrandFooter";
import { submitLeadIntake } from "@/lib/actions/leads";

export default async function QuoteRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { token } = await params;
  const { sent } = await searchParams;
  const t = await getTranslations("quotePage");

  const organizer = await prisma.organizer.findUnique({
    where: { leadIntakeToken: token },
    include: { leadQuestions: { orderBy: { order: "asc" } } },
  });

  if (!organizer) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="rounded-2xl border border-gold/20 bg-warm/90 p-7 shadow-lg backdrop-blur-xl">
        <BrandHeader organizer={organizer} />
        <p className="text-center text-xs uppercase tracking-[0.2em] text-gold-dark">{t("title")}</p>
        <h1 className="mt-1 text-center font-serif text-2xl font-medium text-ink">
          {organizer.brandName || organizer.name}
        </h1>

        {sent === "1" ? (
          <p className="mt-6 text-center text-sm text-ink-muted">{t("sentThankYou")}</p>
        ) : (
          <form action={submitLeadIntake.bind(null, token)} className="mt-6 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">{t("name")}</label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("email")}</label>
              <input
                name="email"
                type="email"
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("phone")}</label>
              <input name="phone" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
            </div>

            {organizer.leadQuestions.map((question) => (
              <div key={question.id}>
                <label className="block text-xs font-medium mb-1">
                  {question.label}
                  {question.required && " *"}
                </label>
                {question.fieldType === "TEXTAREA" ? (
                  <textarea
                    name={`question_${question.id}`}
                    required={question.required}
                    rows={3}
                    className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
                  />
                ) : (
                  <input
                    name={`question_${question.id}`}
                    type={question.fieldType === "NUMBER" ? "number" : "text"}
                    required={question.required}
                    className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
                  />
                )}
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium mb-1">{t("message")}</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-gold/30 hover:shadow-lg"
            >
              {t("sendRequest")}
            </button>
          </form>
        )}

        <BrandFooter />
      </div>
    </div>
  );
}
