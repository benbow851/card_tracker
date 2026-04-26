import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://card-tracker.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cards = await prisma.card.findMany({
    select: { id: true, updatedAt: true, category: true },
    take: 50_000,
  });

  const categoryUrls: MetadataRoute.Sitemap = [
    "one-piece",
    "naruto",
    "pokemon",
    "yu-gi-oh",
    "magic",
  ].map((c) => ({
    url: `${BASE_URL}/cards?category=${c}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/cards`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categoryUrls,
    ...cards.map((c) => ({
      url: `${BASE_URL}/cards/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
