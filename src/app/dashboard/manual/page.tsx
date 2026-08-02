import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PrintButton } from "@/components/PrintButton";
import { formatDate } from "@/lib/dates";

type ManualSection = { title: string; text: string };

export default async function ManualPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const t = await getTranslations("manualPage");
  const commonSections = t.raw("commonSections") as ManualSection[];
  const plannerSections = t.raw("plannerSections") as ManualSection[];
  const isPlanner = session.user.accountType === "PLANNER";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-ink-muted">{t("intro")}</p>
        <PrintButton />
      </div>

      <header className="mb-8 border-b border-gold/20 pb-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Elegance Site" className="mx-auto h-14 w-14" />
        <h1 className="mt-3 font-serif text-2xl font-medium text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {isPlanner ? t("planLabelPlanner") : t("planLabelIndividual")}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 font-serif text-lg font-medium text-ink">{t("commonTitle")}</h2>
        <div className="space-y-5">
          {commonSections.map((item) => (
            <div key={item.title} className="rounded-lg border border-gold/15 bg-white/60 p-4">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {isPlanner && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-lg font-medium text-ink">{t("plannerTitle")}</h2>
          <div className="space-y-5">
            {plannerSections.map((item) => (
              <div key={item.title} className="rounded-lg border border-gold/15 bg-white/60 p-4">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-ink-light">
        {t("generatedOn", { date: formatDate(new Date()) })}
      </p>
    </div>
  );
}
