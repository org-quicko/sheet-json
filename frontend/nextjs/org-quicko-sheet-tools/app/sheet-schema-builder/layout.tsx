import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { ToolIntro } from "@/components/tool-intro"
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
      {children}
      <ToolIntro
        title="Sheet-JSON Schema Builder"
        description={description}
        currentHref="/sheet-schema-builder"
        faqs={[
          {
            question: "Which field types and validations can I use?",
            answer:
              "Fields can be string, number, integer, boolean, object or array. Numbers can use the Long or BigDecimal format. Validations are pattern, minLength, maxLength, minimum, maximum, enum and null allowed.",
          },
          {
            question: "Can I edit an existing JSON Schema?",
            answer:
              "Yes. Use Import JSON Schema to paste a schema, upload a file or load it from a URL. You can also open the Schema Builder with a schema_url query parameter.",
          },
          {
            question: "Where are my workbooks saved?",
            answer: "In your browser's IndexedDB storage. They are not sent to a server.",
          },
        ]}
        steps={[
          "Create a workbook, or import an existing JSON Schema.",
          "Add sheets to the workbook, then add table or list blocks to each sheet.",
          "Add columns to tables and fields to lists, and set their types and validations.",
          "Export the workbook as a JSON Schema (draft-07) file.",
          "Use the schema with the Sheet Visualizer, or generate TypeScript or Java classes from it.",
        ]}
      />
    </>
  )
}
