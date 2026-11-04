import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { OG_IMAGE, TWITTER_IMAGE, webApplication } from "@/lib/site"

const title = "Sheet-JSON Visualizer – Edit Workbook JSON as a Spreadsheet"
const description =
  "Open sheet-json workbook data in a spreadsheet view in your browser. Edit cells, add rows and, if you add a JSON Schema, validate each value against it."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sheet-visualiser" },
  openGraph: { type: "website", siteName: "Sheet Tools", url: "/sheet-visualiser", title, description, images: OG_IMAGE },
  twitter: { card: "summary_large_image", title, description, images: TWITTER_IMAGE },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webApplication("Sheet-JSON Visualizer", "/sheet-visualiser", description)} />
      <h1 className="sr-only">Sheet-JSON Visualizer</h1>
      <p className="sr-only">{description}</p>
      {children}
    </>
  )
}
