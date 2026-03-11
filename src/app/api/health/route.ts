import { NextResponse } from "next/server";
import { getOperationalHealthSnapshot } from "@/lib/health";

export async function GET() {
  const snapshot = await getOperationalHealthSnapshot();
  const statusCode = snapshot.status === "down" ? 503 : snapshot.status === "degraded" ? 200 : 200;

  return NextResponse.json(snapshot, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}