import type { BudgetItem } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { createBudgetItem, updateBudgetItemActual, deleteBudgetItem } from "@/lib/actions/budget";

function formatAmount(value: number): string {
  return value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function BudgetPanel({ eventId, items }: { eventId: string; items: BudgetItem[] }) {
  const t = await getTranslations("budget");
  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedAmount, 0);
  const totalActual = items.reduce((sum, i) => sum + (i.actualAmount ?? 0), 0);

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("addTitle")}</h2>
        <form
          action={createBudgetItem.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("category")}</label>
            <input
              name="category"
              required
              placeholder={t("categoryPlaceholder")}
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("estimated")}</label>
            <input
              name="estimatedAmount"
              type="number"
              min={0}
              step="0.01"
              required
              className="w-28 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("actualOptional")}</label>
            <input
              name="actualAmount"
              type="number"
              min={0}
              step="0.01"
              className="w-28 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("add")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("budgetTitle", { count: items.length })}
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gold/20 bg-white/60 shadow-md backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-2">{t("category")}</th>
                  <th className="px-4 py-2">{t("estimated")}</th>
                  <th className="px-4 py-2">{t("actual")}</th>
                  <th className="px-4 py-2">{t("difference")}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const diff = item.estimatedAmount - (item.actualAmount ?? 0);
                  return (
                    <tr key={item.id} className="border-t border-gold/15">
                      <td className="px-4 py-2 font-medium">{item.category}</td>
                      <td className="px-4 py-2">{formatAmount(item.estimatedAmount)}</td>
                      <td className="px-4 py-2">
                        <form
                          action={updateBudgetItemActual.bind(null, eventId, item.id)}
                          className="flex items-center gap-2"
                        >
                          <input
                            name="actualAmount"
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={item.actualAmount ?? ""}
                            className="w-24 rounded-lg border border-gold/25 px-2 py-1 text-sm"
                          />
                          <button type="submit" className="text-xs text-gold-dark hover:underline">
                            {t("save")}
                          </button>
                        </form>
                      </td>
                      <td
                        className={`px-4 py-2 ${
                          item.actualAmount == null
                            ? "text-ink-muted"
                            : diff < 0
                              ? "text-danger"
                              : "text-success"
                        }`}
                      >
                        {item.actualAmount == null ? "—" : formatAmount(diff)}
                      </td>
                      <td className="px-4 py-2">
                        <form action={deleteBudgetItem.bind(null, eventId, item.id)}>
                          <button type="submit" className="text-sm text-danger hover:underline">
                            {t("delete")}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gold/25 bg-warm font-medium">
                  <td className="px-4 py-2">{t("total")}</td>
                  <td className="px-4 py-2">{formatAmount(totalEstimated)}</td>
                  <td className="px-4 py-2">{formatAmount(totalActual)}</td>
                  <td className="px-4 py-2">{formatAmount(totalEstimated - totalActual)}</td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
