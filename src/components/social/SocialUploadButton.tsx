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

  function openPicker(pickMode: "post" | "story") {
    setMode(pickMode);
    setError(null);
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
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => openPicker("story")}
          disabled={uploading}
          className="flex-1 rounded-lg border border-gold/25 bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-warm disabled:opacity-50"
        >
          {t("addStory")}
        </button>
        <button
          type="button"
          onClick={() => openPicker("post")}
          disabled={uploading}
          className="flex-1 rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {t("addPost")}
        </button>
      </div>

      {pendingFile && (
        <div className="mt-3 rounded-lg border border-gold/20 bg-white p-3">
          <p className="text-xs text-ink-muted">{pendingFile.name}</p>
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

      {uploading && !pendingFile && <p className="mt-2 text-xs text-ink-muted">{t("uploading")}</p>}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
