import crypto from "node:crypto";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]);
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 2400;
const MAX_IMAGE_HEIGHT = 2400;

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

type SaveMediaFileOptions = {
  alt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoRole?: string | null;
  index?: number;
};

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

function normalizeTextFragment(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function extractOriginalBaseName(originalName: string) {
  return path.basename(originalName, path.extname(originalName)).replace(/[-_]+/g, " ").trim();
}

function resolveSeoBaseTitle(options: SaveMediaFileOptions, originalName: string) {
  return options.seoTitle?.trim() || options.alt?.trim() || extractOriginalBaseName(originalName) || "arquivo";
}

function buildSeoSnippet(description?: string | null) {
  if (!description) return "";

  const stopwords = new Set(["de", "da", "do", "das", "dos", "e", "em", "para", "com", "sem", "por", "uma", "um", "ao", "a", "o"]);

  return description
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word))
    .slice(0, 6)
    .join(" ");
}

function buildSeoAltText(options: SaveMediaFileOptions, originalName: string) {
  if (options.alt?.trim()) {
    return options.alt.trim();
  }

  const title = resolveSeoBaseTitle(options, originalName);
  const role = options.seoRole?.trim();
  const snippet = buildSeoSnippet(options.seoDescription || options.alt || extractOriginalBaseName(originalName));

  return [title, role, snippet].filter(Boolean).join(" - ").slice(0, 160);
}

function buildUploadFileName(originalName: string, options: SaveMediaFileOptions) {
  const baseTitle = resolveSeoBaseTitle(options, originalName);
  const role = options.seoRole?.trim();
  const snippet = buildSeoSnippet(options.seoDescription || options.alt || extractOriginalBaseName(originalName));
  const extension = path.extname(originalName).toLowerCase() || ".bin";

  const parts = [baseTitle, role, snippet, typeof options.index === "number" ? String(options.index + 1) : undefined]
    .filter(Boolean)
    .map((value) => normalizeTextFragment(String(value)));
  const basename = parts.join("-").slice(0, 72) || normalizeTextFragment(baseTitle) || "arquivo";

  return `${basename}-${crypto.randomUUID().slice(0, 8)}${extension}`;
}

function replaceExtension(fileName: string, extension: string) {
  return fileName.replace(/\.[^.]+$/, extension);
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
        folder: "luxijoias/media",
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

function buildOptimizedDeliveryUrl(publicId: string) {
  ensureCloudinaryConfig();

  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto:best",
  });
}

async function optimizeUpload(file: File, options: SaveMediaFileOptions = {}) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("O arquivo excede o limite de 12 MB.");
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const normalizedFileName = buildUploadFileName(file.name || "upload", options);

  if (file.type === "image/svg+xml") {
    return {
      buffer: originalBuffer,
      fileName: normalizedFileName,
      mimeType: file.type,
      width: null,
      height: null,
    };
  }

  const pipeline = sharp(originalBuffer, { failOn: "none", limitInputPixels: false }).rotate().resize({
    width: MAX_IMAGE_WIDTH,
    height: MAX_IMAGE_HEIGHT,
    fit: "inside",
    withoutEnlargement: true,
  });

  const optimizedBuffer = await pipeline.webp({
    quality: 86,
    alphaQuality: 100,
    effort: 6,
  }).toBuffer();

  const metadata = await sharp(optimizedBuffer).metadata();

  return {
    buffer: optimizedBuffer,
    fileName: replaceExtension(normalizedFileName, ".webp"),
    mimeType: "image/webp",
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

export async function saveMediaFile(file: File, options: SaveMediaFileOptions = {}) {
  if (!isSupportedUploadType(file.type)) {
    throw new Error("Formato de arquivo não suportado.");
  }

  const optimized = await optimizeUpload(file, options);
  const uploaded = await uploadBufferToCloudinary(optimized.buffer, optimized.fileName, optimized.mimeType || "application/octet-stream");
  const resolvedAlt = buildSeoAltText(options, file.name || optimized.fileName);

  return prisma.mediaAsset.create({
    data: {
      fileName: optimized.fileName,
      originalName: file.name || optimized.fileName,
      mimeType: optimized.mimeType || "application/octet-stream",
      size: uploaded.bytes,
      path: uploaded.public_id,
      url: file.type === "image/svg+xml" ? uploaded.secure_url : buildOptimizedDeliveryUrl(uploaded.public_id),
      alt: resolvedAlt || null,
      width: optimized.width,
      height: optimized.height,
    },
  });
}
