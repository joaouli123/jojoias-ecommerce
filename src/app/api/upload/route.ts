import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { unauthorizedJson } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { saveMediaFile } from "@/lib/media";

async function ensureUploadPermission() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const role = session.user.role;
  if (hasAdminPermission(role, "products:manage") || hasAdminPermission(role, "marketing:manage")) {
    return session.user;
  }

  return null;
}

export async function GET() {
  if (!(await ensureUploadPermission())) {
    return unauthorizedJson();
  }

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  if (!(await ensureUploadPermission())) {
    return unauthorizedJson();
  }

  try {
    const formData = await request.formData();
    const altValue = formData.get("alt");
    const alt = typeof altValue === "string" ? altValue.trim() : undefined;
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!files.length) {
      return NextResponse.json({ error: "Selecione ao menos um arquivo." }, { status: 400 });
    }

    const assets = [];
    for (const file of files.slice(0, 10)) {
      assets.push(await saveMediaFile(file, alt));
    }

    return NextResponse.json({ assets, message: `${assets.length} arquivo(s) enviado(s) com sucesso.` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao enviar mídia." }, { status: 400 });
  }
}
