import { NextResponse } from "next/server";
import { getCardById } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const card = await getCardById(params.id);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  return NextResponse.json(card);
}
