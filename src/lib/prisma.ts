import { PrismaClient } from "@prisma/client";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function resolveDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(databaseUrl);

    if (parsedUrl.hostname.includes("-pooler.")) {
      if (!parsedUrl.searchParams.has("pgbouncer")) {
        parsedUrl.searchParams.set("pgbouncer", "true");
      }

      if (!parsedUrl.searchParams.has("connect_timeout")) {
        parsedUrl.searchParams.set("connect_timeout", "15");
      }
    }

    return parsedUrl.toString();
  } catch {
    return databaseUrl;
  }
}

const datasourceUrl = resolveDatasourceUrl();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: datasourceUrl
      ? {
          db: {
            url: datasourceUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

