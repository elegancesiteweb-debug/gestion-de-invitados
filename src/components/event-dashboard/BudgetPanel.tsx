import type { BudgetItem } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  createBudgetItem,
  updateBudgetItemActual,
  deleteBudgetItem,
  updateTotalBudget,
} from "@/lib/actions/budget";

function formatAmount(value: number): string {
  return value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function BudgetPanel({
  eventId,
  items,
  totalBudget,
}: {
  eventId: string;
  items: BudgetItem[];
  totalBudget: number | null;
}) {
  const t = await getTranslations("budget");
  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedAmount, 0);
  const totalActual = items.reduce((sum, i) => sum + (i.actualAmount ?? 0), 0);
  const remaining = totalBudget != null ? totalBudget - totalActual : null;
  const usedPct = totalBudget != null && totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : null;
  const isOverBudget = totalBudget != null && (totalActual > totalBudget || totalEstimated > totalBudget);

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("totalBudgetTitle")}</h2>
        <form
          action={updateTotalBudget.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("totalBudgetLabel")}</label>
            <input
              name="totalBudget"
              type="number"
              min={0}
              step="0.01"
              defaultValue={totalBudget ?? ""}
              placeholder={t("totalBudgetPlaceholder")}
              className="w-40 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
          >
            {t("save")}
          </button>
        </form>

        {totalBudget != null && (
          <div className="mt-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-muted">{t("totalBudgetTitle")}</p>
                <p className="font-serif text-lg font-medium text-ink">{formatAmount(totalBudget)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">{t("estimated")}</p>
                <p className="font-serif text-lg font-medium text-ink">{formatAmount(totalEstimated)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">{t("actual")}</p>
                <p className="font-serif text-lg font-medium text-ink">{formatAmount(totalActual)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">{t("remaining")}</p>
                <p className={`font-serif text-lg font-medium ${remaining != null && remaining < 0 ? "text-danger" : "text-ink"}`}>
                  {formatAmount(remaining ?? 0)}
                </p>
              </div>
            </div>

            {usedPct != null && (
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-warm">
                <div
                  className={`h-full rounded-full ${isOverBudget ? "bg-danger" : "bg-gradient-to-r from-gold-dark to-gold-deep"}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            )}

            {isOverBudget && (
              <p className="mt-2 text-xs font-medium text-danger">{t("overBudgetWarning")}</p>
            )}
          </div>
        )}
      </section>

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
