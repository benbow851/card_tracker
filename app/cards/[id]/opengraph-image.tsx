import { ImageResponse } from "next/og";
import { getCardById, getPrice } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const runtime = "nodejs";
export const alt = "Card Price Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const card = await getCardById(params.id);
  if (!card) {
    return new ImageResponse(<div>Card not found</div>, size);
  }
  const price = await getPrice(card.id);
  const setLabel = `${card.series ?? card.category} · ${card.setCode}`;
  const numberLabel = `#${card.cardNumber} · ${card.rarity}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #060e20 0%, #0f1930 50%, #192540 100%)",
          color: "#dee5ff",
          fontFamily: "Inter, sans-serif",
          padding: 60,
        }}
      >
        {/* Card image */}
        {card.imageUrl && (
          <div
            style={{
              width: 360,
              height: 504,
              borderRadius: 24,
              overflow: "hidden",
              display: "flex",
              background: "#192540",
            }}
          >
            <img
              src={card.imageUrl}
              alt=""
              width={360}
              height={504}
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

        {/* Right side: text + price */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 60,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#a3aac4",
              marginBottom: 16,
              fontWeight: 700,
              display: "flex",
            }}
          >
            {setLabel}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#dee5ff",
              marginBottom: 12,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            {card.name}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#3bbffa",
              marginBottom: 36,
              fontWeight: 700,
              display: "flex",
            }}
          >
            {numberLabel}
          </div>

          {price && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(25, 37, 64, 0.6)",
                borderLeft: "4px solid #3bbffa",
                padding: 24,
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#a3aac4",
                  marginBottom: 4,
                  fontWeight: 700,
                  display: "flex",
                }}
              >
                Market Floor
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#dee5ff",
                  letterSpacing: -1,
                  display: "flex",
                }}
              >
                {formatPrice(price.current)}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "auto",
              fontSize: 18,
              color: "#a3aac4",
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 2,
                background: "#3bbffa",
              }}
            />
            The Digital Vault
          </div>
        </div>
      </div>
    ),
    size
  );
}
