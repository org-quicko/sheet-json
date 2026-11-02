import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { webApplication } from "@/lib/site"

const title = "Sheet-JSON Visualizer – View and Edit Workbook JSON as a Spreadsheet"
const description =
  "Open sheet-json workbook data in a spreadsheet view. Edit cells, add rows, and validate every value against your JSON Schema in the browser."

export const metadata: Metadata = {
  title: `${title} | Sheet Tools`,
  description,
  alternates: { canonical: "/sheet-visualiser" },
  openGraph: { type: "website", siteName: "Sheet Tools", url: "/sheet-visualiser", title, description, images: "/opengraph-image" },
  twitter: { card: "summary_large_image", title, description, images: "/twitter-image" },
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
