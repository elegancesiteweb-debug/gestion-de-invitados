"use client";

import { useState, useTransition, type FormEvent } from "react";
import { uploadFloorPlanImage, removeFloorPlanImage } from "@/lib/actions/floorPlan";
import { convertPdfPageToImageBlob } from "@/lib/pdfToImage";

export function FloorPlanUploadForm({ eventId, hasImage }: { eventId: string; hasImage: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }

    let imageFile = file;
    if (file.type === "application/pdf") {
      setConverting(true);
      try {
        const blob = await convertPdfPageToImageBlob(file);
        imageFile = new File([blob], "plano.png", { type: "image/png" });
      } catch {
        setError("No se pudo convertir el PDF. Intenta subir una imagen.");
        setConverting(false);
        return;
      }
      setConverting(false);
    } else if (!file.type.startsWith("image/")) {
      setError("Solo se aceptan imágenes o PDF");
      return;
    }

    const formData = new FormData();
    formData.set("image", imageFile);
    startTransition(() => {
      uploadFloorPlanImage(eventId, formData).catch(() => setError("No se pudo subir el archivo"));
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
      >
        {error && <p className="w-full text-sm text-danger">{error}</p>}
        <div>
          <label className="block text-xs font-medium mb-1">Imagen o PDF del salón</label>
          <input
            type="file"
            name="file"
            accept="image/*,application/pdf"
            required
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={converting}
          className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg disabled:opacity-50"
        >
          {converting ? "Convirtiendo..." : "Subir"}
        </button>
      </form>
      {hasImage && (
        <form action={removeFloorPlanImage.bind(null, eventId)}>
          <button
            type="submit"
            className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm text-danger hover:bg-danger-bg"
          >
            Quitar imagen
          </button>
        </form>
      )}
    </div>
  );
}
