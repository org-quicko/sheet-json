import { ImageResponse } from "next/og"

export const alt = "Sheet Tools – build, visualise and generate sheet-json schemas"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)",
          color: "#111827",
        }}
      >
        <div style={{ fontSize: 40, color: "#2563eb", fontWeight: 700 }}>Sheet Tools</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>
          Build, visualise and generate sheet-json schemas
        </div>
        <div style={{ fontSize: 32, color: "#4b5563", marginTop: 32 }}>
          Schema Builder · Sheet Visualizer · TypeScript and Java generators
        </div>
      </div>
    ),
    size,
  )
}
