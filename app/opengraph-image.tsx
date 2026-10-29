import { ImageResponse } from "next/og";

export const alt = "Biomedical Conference Radar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #020817 0%, #0f172a 40%, #082f49 100%)",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "88%",
            height: "78%",
            borderRadius: 32,
            padding: 52,
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(125, 211, 252, 0.4)",
            boxShadow: "0 22px 60px rgba(14, 165, 233, 0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
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
            <div style={{ fontSize: 28, letterSpacing: 3, color: "#7dd3fc", textTransform: "uppercase" }}>
              Biomedical AR-GE
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
              Konferans Radarı
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.4, color: "#cbd5e1", maxWidth: 820 }}>
              Deadline, hibe, çağrı ve akademik etkinlikleri tek ekranda takip edin.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: "auto",
            }}
          >
            {[
              "Güvenilir kaynaklar",
              "Deadline takibi",
              "Dünya haritası",
            ].map((label) => (
              <div
                key={label}
                style={{
                  padding: "12px 20px",
                  borderRadius: 999,
                  background: "rgba(15, 118, 110, 0.25)",
                  border: "1px solid rgba(45, 212, 191, 0.36)",
                  color: "#ccfbf1",
                  fontSize: 24,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
