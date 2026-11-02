import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { ToolIntro } from "@/components/tool-intro"
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
      {children}
      <ToolIntro
        title="Sheet-JSON Visualizer"
        description={description}
        currentHref="/sheet-visualiser"
        faqs={[
          {
            question: "Do I need a JSON Schema to use the visualiser?",
            answer:
              "No. You can view and edit sheet-json data without a schema. Add a schema to validate each value and mark the cells that do not match.",
          },
          {
            question: "Can I load data from a URL?",
            answer:
              "Yes. Use the From URL option, or open the visualiser with data_url and schema_url query parameters. Your browser fetches the URL directly.",
          },
          {
            question: "How do I save my changes?",
            answer: "Use Export to download the workbook as a JSON file.",
          },
        ]}
        steps={[
          "Import your sheet data: paste the JSON, upload a file, or load it from a URL.",
          "Optionally, import a validation schema in the same way.",
          "Move between sheets and blocks, and see each block as a spreadsheet.",
          "Edit cells and add rows. Cells that do not match the schema are marked.",
          "Export the updated workbook as a JSON file.",
        ]}
      />
    </>
  )
}
