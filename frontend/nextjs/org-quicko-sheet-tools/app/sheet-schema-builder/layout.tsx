import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { webApplication } from "@/lib/site"

const title = "Sheet-JSON Schema Builder – Visual JSON Schema Editor"
const description =
  "Build JSON Schemas (draft-07) for sheet-json workbooks in your browser. Define sheets, tables, lists, field types and validations, then export the schema."

export const metadata: Metadata = {
  title: `${title} | Sheet Tools`,
  description,
  alternates: { canonical: "/sheet-schema-builder" },
  openGraph: { type: "website", siteName: "Sheet Tools", url: "/sheet-schema-builder", title, description, images: "/opengraph-image" },
  twitter: { card: "summary_large_image", title, description, images: "/twitter-image" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webApplication("Sheet-JSON Schema Builder", "/sheet-schema-builder", description)} />
      <h1 className="sr-only">Sheet-JSON Schema Builder</h1>
      <p className="sr-only">{description}</p>
      {children}
    </>
  )
}
