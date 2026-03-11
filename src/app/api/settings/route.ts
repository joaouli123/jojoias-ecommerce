import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-settings";

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}
