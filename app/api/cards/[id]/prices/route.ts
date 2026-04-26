import { NextResponse } from "next/server";
import { getPrice } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const price = await getPrice(params.id);
  if (!price) {
    return NextResponse.json({ error: "Price data not found" }, { status: 404 });
  }
  return NextResponse.json(price);
}
