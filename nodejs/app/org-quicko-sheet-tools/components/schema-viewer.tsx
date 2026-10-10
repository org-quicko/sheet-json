"use client"

import { useState } from "react"
import { Download, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSchemaStore } from "@/store/schema-store"
import type { ListBlock, TableBlock } from "@/types/schema"

export function SchemaViewer() {
  const { workbooks, activeWorkbookId } = useSchemaStore()
  const [isVisible, setIsVisible] = useState(false)

  const generateSchema = () => {
    const activeWorkbook = workbooks.find((wb) => wb.id === activeWorkbookId)
    if (!activeWorkbook) return null

    const schema = {
      workbook: activeWorkbook.name,
      sheets: activeWorkbook.sheets.map((sheet) => ({
        name: sheet.name,
        blocks: sheet.blocks.map((block) => {
          if (block.type === "list") {
            const listBlock = block as ListBlock
            return {
              type: "list",
              name: listBlock.name,
              properties: Object.fromEntries(
                listBlock.items.map((item) => [
                  item.key || "unnamed",
                  {
                    type: item.type,
                    example: item.value,
                  },
                ]),
              ),
            }
          } else {
            const tableBlock = block as TableBlock
            return {
              type: "table",
              name: tableBlock.name,
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: Object.fromEntries(
                    tableBlock.headers.map((header) => [header.name || "unnamed", { type: header.type }]),
                  ),
                },
              },
            }
          }
        }),
      })),
    }

    return schema
  }

  const exportSchema = () => {
    const schema = generateSchema()
    if (schema) {
      const blob = new Blob([JSON.stringify(schema, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${schema.workbook || "schema"}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const schema = generateSchema()

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>JSON Schema</CardTitle>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isVisible ? "Hide" : "Show"}
          </Button>
          <Button size="sm" onClick={exportSchema} disabled={!schema}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isVisible && schema ? (
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(schema, null, 2)}
          </pre>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {!schema ? "Select a workbook to view schema" : 'Click "Show" to view schema'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
