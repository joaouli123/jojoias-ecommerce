import crypto from "node:crypto";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
    secure: true,
  });
}

function normalizeFileName(name: string) {
  const extension = path.extname(name).toLowerCase() || ".bin";
  const basename = path.basename(name, extension)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "arquivo";

  return `${basename}-${crypto.randomUUID().slice(0, 8)}${extension}`;
}

export function isSupportedUploadType(mimeType: string) {
  return ALLOWED_IMAGE_TYPES.has(mimeType);
}

function ensureCloudinaryConfig() {
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    throw new Error("Cloudinary não configurado.");
  }
}

function uploadBufferToCloudinary(buffer: Buffer, fileName: string, mimeType: string) {
  ensureCloudinaryConfig();

  return new Promise<{ secure_url: string; public_id: string; bytes: number }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "jojoias/media",
        public_id: fileName.replace(/\.[^.]+$/, ""),
        resource_type: mimeType === "image/svg+xml" ? "image" : "auto",
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          reject(error ?? new Error("Falha ao enviar arquivo para o Cloudinary."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes ?? buffer.byteLength,
        });
      },
    );

    upload.end(buffer);
  });
}

export async function saveMediaFile(file: File, alt?: string | null) {
  if (!isSupportedUploadType(file.type)) {
    throw new Error("Formato de arquivo não suportado.");
  }

  const fileName = normalizeFileName(file.name || "upload");
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadBufferToCloudinary(buffer, fileName, file.type || "application/octet-stream");

  return prisma.mediaAsset.create({
    data: {
      fileName,
      originalName: file.name || fileName,
      mimeType: file.type || "application/octet-stream",
      size: uploaded.bytes,
      path: uploaded.public_id,
      url: uploaded.secure_url,
      alt: alt || null,
    },
  });
}
