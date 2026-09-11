import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("El muro de recuerdos no está configurado (faltan credenciales de R2).");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("El muro de recuerdos no está configurado (falta el bucket de R2).");
  }
  return bucket;
}

export function buildStorageKey(eventId: string, contentType: string): string {
  const ext = contentType.startsWith("video/") ? "mp4" : contentType.split("/")[1] || "jpg";
  return `social/${eventId}/${randomUUID()}.${ext}`;
}

// URL firmada de subida (PUT), válida unos minutos — el navegador sube el archivo
// directo a R2 sin que pase por el servidor de Next.js.
export async function createUploadUrl(storageKey: string, contentType: string): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: storageKey,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 300 });
}

export function getPublicUrl(storageKey: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) {
    throw new Error("El muro de recuerdos no está configurado (falta la URL pública de R2).");
  }
  return `${base.replace(/\/$/, "")}/${storageKey}`;
}
