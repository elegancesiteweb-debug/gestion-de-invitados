import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { createVendor, deleteVendor } from "@/lib/actions/vendors";

export default async function VendorsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "vendor_directory")) {
    notFound();
  }
  const t = await getTranslations("vendorsPage");

  const vendors = await prisma.vendor.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const categories = [...new Set(vendors.map((v) => v.category).filter(Boolean))] as string[];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        {t("backToEvents")}
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">{t("title")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>

      <datalist id="vendor-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("addVendor")}</h2>
        <form
          action={createVendor}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input name="name" required className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("category")}</label>
            <input
              name="category"
              list="vendor-categories"
              placeholder={t("categoryPlaceholder")}
              className="w-36 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("phone")}</label>
            <input name="phone" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("email")}</label>
            <input name="email" type="email" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("notes")}</label>
            <input name="notes" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("add")}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("yourVendors", { count: vendors.length })}
        </h2>
        {vendors.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noVendors")}</p>
        ) : (
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="font-medium text-ink">
                    {vendor.name}
                    {vendor.category && (
                      <span className="ml-2 rounded-full bg-warm px-2 py-0.5 text-xs text-ink-muted">
                        {vendor.category}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {vendor.phone || ""} {vendor.email ? `· ${vendor.email}` : ""}
                  </p>
                  {vendor.notes && <p className="mt-1 text-xs text-ink-muted">{vendor.notes}</p>}
                </div>
                <form action={deleteVendor.bind(null, vendor.id)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    {t("delete")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
