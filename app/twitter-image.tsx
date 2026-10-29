import { ImageResponse } from "next/og";

export const alt = "Biomedical Conference Radar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #082f49 45%, #155e75 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "88%",
            height: "78%",
            borderRadius: 30,
            padding: 52,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(125, 211, 252, 0.32)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
                color: "#f8fafc",
                fontWeight: 800,
                fontSize: 28,
              }}
            >
              B
            </div>
            <div style={{ fontSize: 24, letterSpacing: 2, color: "#7dd3fc", textTransform: "uppercase" }}>
              Biomedical Conference Radar
            </div>
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 820 }}>
            Biyomedikal AR-GE için doğru çağrılar.
          </div>
          <div style={{ marginTop: 20, fontSize: 28, color: "#cbd5e1" }}>
            Deadline, harita, takip listesi ve güvenilir veri akışı tek ekranda.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
