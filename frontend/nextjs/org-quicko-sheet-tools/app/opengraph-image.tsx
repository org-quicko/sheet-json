import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { OG_IMAGE_ALT, OG_IMAGE_SIZE } from "@/lib/site"

export const alt = OG_IMAGE_ALT
export const size = OG_IMAGE_SIZE
export const contentType = "image/png"

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "assets/inter-latin-400-normal.woff")),
    readFile(join(process.cwd(), "assets/inter-latin-700-normal.woff")),
  ])

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
          fontFamily: "Inter",
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)",
          color: "#111827",
        }}
      >
        <div style={{ fontSize: 40, color: "#2563eb", fontWeight: 700 }}>Sheet Tools</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>
          Build, visualize and generate sheet-json schemas
        </div>
        <div style={{ fontSize: 32, color: "#4b5563", marginTop: 32 }}>
          Schema Builder · Sheet Visualizer · Code Generators
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    },
  )
}
