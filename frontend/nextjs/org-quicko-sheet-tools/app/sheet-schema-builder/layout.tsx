import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { OG_IMAGE, TWITTER_IMAGE, webApplication } from "@/lib/site"

const title = "Sheet-JSON Schema Builder – JSON Schema Editor"
const description =
  "Build JSON Schemas (draft-07) for sheet-json workbooks in your browser. Define sheets, tables, lists, field types and validations, then export the schema."

export const metadata: Metadata = {
  title: `${title} | Sheet Tools`,
  description,
  alternates: { canonical: "/sheet-schema-builder" },
  openGraph: { type: "website", siteName: "Sheet Tools", url: "/sheet-schema-builder", title, description, images: OG_IMAGE },
  twitter: { card: "summary_large_image", title, description, images: TWITTER_IMAGE },
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
