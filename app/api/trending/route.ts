import { NextResponse } from "next/server";
import { getTrending } from "@/lib/queries";

export async function GET() {
  const trending = await getTrending();
  return NextResponse.json({
    gainers: trending.filter((c) => c.changePercent >= 0),
    losers: trending.filter((c) => c.changePercent < 0),
  });
}
