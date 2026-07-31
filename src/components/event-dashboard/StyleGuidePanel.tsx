import type { Event } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  updateStyleGuide,
  uploadStyleGuideImage,
  deleteStyleGuideImage,
} from "@/lib/actions/styleGuide";

export async function StyleGuidePanel({
  event,
  images,
}: {
  event: Event;
  images: { id: string; imageType: string; uploadedBy: "ORGANIZER" | "CLIENT" }[];
}) {
  const t = await getTranslations("styleGuide");
  const colors = (event.colorPalette ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("paletteTitle")}</h2>
        <form
          action={updateStyleGuide.bind(null, event.id)}
          className="space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("colorsLabel")}</label>
            <input
              name="colorPalette"
              defaultValue={event.colorPalette ?? ""}
              placeholder="#c9a84c, #2a2118, #f5f0e8"
              className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
            />
            {colors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <span
                    key={color}
                    className="flex items-center gap-2 rounded-full border border-gold/20 bg-white px-2 py-1 text-xs text-ink-muted"
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-ink/10"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("notesLabel")}</label>
            <textarea
              name="styleNotes"
              defaultValue={event.styleNotes ?? ""}
              rows={3}
              placeholder={t("notesPlaceholder")}
              className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("save")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("imagesTitle")}</h2>
        <form
          action={uploadStyleGuideImage.bind(null, event.id)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <input type="file" name="image" accept="image/*" required className="text-sm" />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("upload")}
          </button>
        </form>

        {images.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">{t("noImages")}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/style-guide-images/${image.id}`}
                  alt=""
                  className="h-32 w-full object-cover"
                />
                {image.uploadedBy === "CLIENT" && (
                  <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {t("uploadedByClient")}
                  </span>
                )}
                <form
                  action={deleteStyleGuideImage.bind(null, event.id, image.id)}
                  className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-center opacity-0 transition group-hover:opacity-100"
                >
                  <button type="submit" className="text-xs text-white hover:underline">
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
