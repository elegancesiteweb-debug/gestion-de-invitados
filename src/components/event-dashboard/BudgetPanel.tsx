import type { BudgetItem } from "@prisma/client";
import { createBudgetItem, updateBudgetItemActual, deleteBudgetItem } from "@/lib/actions/budget";

function formatAmount(value: number): string {
  return value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BudgetPanel({ eventId, items }: { eventId: string; items: BudgetItem[] }) {
  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedAmount, 0);
  const totalActual = items.reduce((sum, i) => sum + (i.actualAmount ?? 0), 0);

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Agregar renglón</h2>
        <form
          action={createBudgetItem.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Categoría</label>
            <input
              name="category"
              required
              placeholder="Ej. Catering"
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Estimado</label>
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
            <label className="block text-xs font-medium mb-1">Real (opcional)</label>
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
            Agregar
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Presupuesto ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay renglones de presupuesto.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gold/20 bg-white/60 shadow-md backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2">Estimado</th>
                  <th className="px-4 py-2">Real</th>
                  <th className="px-4 py-2">Diferencia</th>
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
                            Guardar
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
                            Eliminar
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gold/25 bg-warm font-medium">
                  <td className="px-4 py-2">Total</td>
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
