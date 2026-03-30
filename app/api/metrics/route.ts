import { NextResponse } from "next/server";
import { getKpiSnapshot } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getKpiSnapshot());
}
