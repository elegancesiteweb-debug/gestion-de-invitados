"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { requestUploadUrl, createSocialPost, createSocialStory } from "@/lib/actions/socialPortal";

export function SocialUploadButton({ token }: { token: string }) {
  const t = useTranslations("socialPage");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"post" | "story" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function openPicker(pickMode: "post" | "story") {
    setMode(pickMode);
    setError(null);
    setMenuOpen(false);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (mode === "story") {
      void upload(file, "story", "");
    } else {
      setPendingFile(file);
    }
  }

  async function upload(file: File, kind: "post" | "story", captionText: string) {
    setUploading(true);
    setError(null);
    try {
      const { uploadUrl, storageKey, type } = await requestUploadUrl(token, file.type, file.size);
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        throw new Error(t("uploadError"));
      }
      if (kind === "story") {
        await createSocialStory(token, storageKey, type);
      } else {
        await createSocialPost(token, storageKey, type, captionText);
      }
      setPendingFile(null);
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
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="max-w-72 rounded-lg bg-white px-3 py-1.5 text-xs text-danger shadow-md">{error}</p>
      )}
      {uploading && !pendingFile && (
        <p className="rounded-lg bg-white px-3 py-1.5 text-xs text-ink-muted shadow-md">{t("uploading")}</p>
      )}

      {pendingFile && (
        <div className="w-72 rounded-lg border border-gold/20 bg-white p-3 shadow-lg">
          <p className="truncate text-xs text-ink-muted">{pendingFile.name}</p>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t("captionPlaceholder")}
            className="mt-2 w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="flex-1 rounded-lg border border-gold/25 px-3 py-1.5 text-xs font-medium hover:bg-warm"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => pendingFile && void upload(pendingFile, "post", caption)}
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
