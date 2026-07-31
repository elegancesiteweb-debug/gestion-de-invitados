import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import {
  createPackage,
  deletePackage,
  addPackageItem,
  deletePackageItem,
} from "@/lib/actions/packages";

export default async function PackagesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "crm_packages")) {
    notFound();
  }
  const t = await getTranslations("packagesPage");

  const packages = await prisma.package.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/dashboard/leads" className="text-sm text-gold-dark hover:underline">
        {t("backToLeads")}
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">{t("title")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("createPackage")}</h2>
        <form
          action={createPackage}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input name="name" required placeholder={t("namePlaceholder")} className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("description")}</label>
            <input name="description" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("create")}
          </button>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        {packages.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noPackages")}</p>
        ) : (
          packages.map((pkg) => {
            const total = pkg.items.reduce((sum, item) => sum + item.amount, 0);
            return (
              <div
                key={pkg.id}
                className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{pkg.name}</p>
                    {pkg.description && <p className="text-xs text-ink-muted">{pkg.description}</p>}
                  </div>
                  <form action={deletePackage.bind(null, pkg.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      {t("delete")}
                    </button>
                  </form>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {pkg.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span>{item.description}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-ink-muted">
                          {item.amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                        </span>
                        <form action={deletePackageItem.bind(null, item.id)}>
                          <button type="submit" className="text-xs text-danger hover:underline">
                            {t("remove")}
                          </button>
                        </form>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-sm font-medium text-ink">
                  {t("total")}: {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                </p>

                <form
                  action={addPackageItem.bind(null, pkg.id)}
                  className="mt-3 flex flex-wrap items-end gap-2 border-t border-gold/15 pt-3"
                >
                  <div className="flex-1">
                    <input
                      name="description"
                      required
                      placeholder={t("description")}
                      className="w-full rounded-lg border border-gold/25 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder={t("amount")}
                      className="w-full rounded-lg border border-gold/25 px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg border border-gold/25 px-3 py-1 text-sm hover:bg-warm"
                  >
                    {t("addItem")}
                  </button>
                </form>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
