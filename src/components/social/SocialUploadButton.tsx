"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { requestUploadUrl, createSocialPost, createSocialStory } from "@/lib/actions/socialPortal";
import { resolveContentType } from "@/lib/mediaType";

export function SocialUploadButton({ token }: { token: string }) {
  const t = useTranslations("socialPage");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"post" | "story" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Vistas previas locales de las fotos seleccionadas antes de publicar —
  // derivadas de pendingFiles, no estado aparte; el efecto solo libera los
  // URLs viejos, nunca actualiza estado.
  const previewUrls = useMemo(() => pendingFiles.map((file) => URL.createObjectURL(file)), [pendingFiles]);
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  function openPicker(pickMode: "post" | "story") {
    setMode(pickMode);
    setError(null);
    setMenuOpen(false);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (mode === "story") {
      void upload([files[0]], "story", "");
      return;
    }

    // Varias fotos a la vez se suben como carrusel; si viene cualquier
    // archivo que no sea imagen mezclado, se ignora la multi-selección y se
    // sube solo el primero (comportamiento de siempre, sin sorpresas).
    const allImages = files.every((file) => resolveContentType(file.type, file.name).startsWith("image/"));
    setPendingFiles(files.length > 1 && allImages ? files : [files[0]]);
  }

  async function upload(files: File[], kind: "post" | "story", captionText: string) {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const contentType = resolveContentType(file.type, file.name);
          const { uploadUrl, storageKey, type } = await requestUploadUrl(token, contentType, file.size);
          const res = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
          });
          if (!res.ok) {
            throw new Error(t("uploadError"));
          }
          return { storageKey, type };
        })
      );

      if (kind === "story") {
        await createSocialStory(token, uploaded[0].storageKey, uploaded[0].type);
      } else {
        await createSocialPost(
          token,
          uploaded.map((u) => u.storageKey),
          uploaded[0].type,
          captionText
        );
      }
      setPendingFiles([]);
      setCaption("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.mov,.heic,.heif,.m4a,.3gp,.mkv"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="max-w-72 rounded-lg bg-white px-3 py-1.5 text-xs text-danger shadow-md">{error}</p>
      )}
      {uploading && pendingFiles.length === 0 && (
        <p className="rounded-lg bg-white px-3 py-1.5 text-xs text-ink-muted shadow-md">{t("uploading")}</p>
      )}

      {pendingFiles.length > 0 && (
        <div className="w-72 rounded-lg border border-gold/20 bg-white p-3 shadow-lg">
          {previewUrls.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previewUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="h-16 w-16 flex-none rounded-lg object-cover" />
              ))}
            </div>
          ) : (
            <p className="truncate text-xs text-ink-muted">{pendingFiles[0].name}</p>
          )}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t("captionPlaceholder")}
            className="mt-2 w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPendingFiles([])}
              className="flex-1 rounded-lg border border-gold/25 px-3 py-1.5 text-xs font-medium hover:bg-warm"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => pendingFiles.length > 0 && void upload(pendingFiles, "post", caption)}
              className="flex-1 rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {uploading ? t("uploading") : t("publish")}
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => openPicker("story")}
            disabled={uploading}
            className="animate-[fadeIn_0.15s_ease] whitespace-nowrap rounded-full border border-gold/25 bg-white px-4 py-2 text-sm font-medium text-ink shadow-md hover:bg-warm disabled:opacity-50"
          >
            {t("addStory")}
          </button>
          <button
            type="button"
            onClick={() => openPicker("post")}
            disabled={uploading}
            className="animate-[fadeIn_0.15s_ease] whitespace-nowrap rounded-full bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {t("addPost")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={t("addPost")}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-dark to-gold-deep text-2xl text-white shadow-lg shadow-gold/30 transition-transform hover:shadow-xl ${menuOpen ? "rotate-45" : ""}`}
      >
        +
      </button>
    </div>
  );
}
