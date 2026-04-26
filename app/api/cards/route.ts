import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
  const offset = Number(searchParams.get("offset") ?? "0");

  const where = {
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { setName: { contains: search, mode: "insensitive" as const } },
            { cardNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.card.count({ where }),
  ]);

  return NextResponse.json({ cards, total });
}
