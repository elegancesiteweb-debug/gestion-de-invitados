// Algunos selectores de archivo (sobre todo en Android, o con videos .mov
// transferidos desde otra app/dispositivo en vez de grabados en el momento)
// reportan file.type vacío o genérico ("application/octet-stream") para
// formatos que sí son válidos — sin esto, esos archivos se rechazaban aunque
// fueran fotos/videos/audios reales.
const EXTENSION_MIME_MAP: Record<string, string> = {
  mov: "video/quicktime",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  avi: "video/x-msvideo",
  "3gp": "video/3gpp",
  mkv: "video/x-matroska",
  heic: "image/heic",
  heif: "image/heic",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
};

export function resolveContentType(providedType: string, fileName: string): string {
  if (
    providedType.startsWith("image/") ||
    providedType.startsWith("video/") ||
    providedType.startsWith("audio/")
  ) {
    return providedType;
  }
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_MAP[ext] ?? providedType;
}
