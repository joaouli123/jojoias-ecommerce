import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

type ImageReport = {
  file: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  alpha: boolean;
  recommendation: string;
};

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "public");
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const ignoredSegments = new Set([".venv"]);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walk(dir: string, acc: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (ignoredSegments.has(entry.name)) continue;
      walk(fullPath, acc);
      continue;
    }

    if (!supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    acc.push(fullPath);
  }

  return acc;
}

function buildRecommendation(meta: sharp.Metadata, bytes: number, relativePath: string) {
  const recommendations: string[] = [];

  if (bytes > 200 * 1024) {
    recommendations.push("arquivo pesado");
  }

  if ((meta.width || 0) > 1600) {
    recommendations.push("largura acima do comum para web");
  }

  if ([".png", ".jpg", ".jpeg"].includes(path.extname(relativePath).toLowerCase())) {
    recommendations.push("avaliar AVIF/WebP");
  }

  if (!recommendations.length) {
    recommendations.push("ok");
  }

  return recommendations.join(", ");
}

async function main() {
  const files = walk(publicDir);
  const reports: ImageReport[] = [];

  for (const file of files) {
    const relativePath = path.relative(projectRoot, file).replace(/\\/g, "/");
    const stats = fs.statSync(file);
    const meta = await sharp(file).metadata();

    reports.push({
      file: relativePath,
      format: meta.format || "unknown",
      width: meta.width || 0,
      height: meta.height || 0,
      bytes: stats.size,
      alpha: Boolean(meta.hasAlpha),
      recommendation: buildRecommendation(meta, stats.size, relativePath),
    });
  }

  reports.sort((left, right) => right.bytes - left.bytes);

  for (const report of reports) {
    console.log([
      report.file,
      report.format,
      `${report.width}x${report.height}`,
      formatBytes(report.bytes),
      report.alpha ? "alpha" : "opaque",
      report.recommendation,
    ].join(" | "));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
