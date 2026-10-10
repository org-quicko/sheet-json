"use client"

import { useState } from "react"
import { Eye, FileText, Copy, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSchemaStore } from "@/store/schema-store"
import type { ListBlock, TableBlock, KeyValuePair, TableHeader } from "@/types/schema"

export function SchemaDialog() {
  const { workbooks, activeWorkbookId } = useSchemaStore()
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateJsonSchema = () => {
    const activeWorkbook = workbooks.find((wb) => wb.id === activeWorkbookId)
    if (!activeWorkbook) return null

    // Helper function to build field schema from our field configuration
    const buildFieldSchema = (field: KeyValuePair | TableHeader) => {
      const schema: any = {}

      // Set base type, handle nullable
      if (field.nullAllowed) {
        schema.type = [field.type, "null"]
      } else {
        schema.type = field.type
      }

      // Add format if specified
      if (field.format) {
        schema.format = field.format.toLowerCase()
      }

      if (field.description) {
        schema.description = field.description
      }

      if (field.examples && field.examples.length > 0) {
        schema.examples = field.examples
      }

      if (field.enum && field.enum.length > 0) {
        schema.enum = field.enum
      }

      if (field.pattern) {
        schema.pattern = field.pattern
      }

      if (field.minLength !== undefined) {
        schema.minLength = field.minLength
      }

      if (field.maxLength !== undefined) {
        schema.maxLength = field.maxLength
      }

      if (field.minimum !== undefined) {
        schema.minimum = field.minimum
      }

      if (field.maximum !== undefined) {
        schema.maximum = field.maximum
      }

      return schema
    }

    // Generate sheet schemas
    const sheetSchemas = activeWorkbook.sheets.map((sheet) => {
      const blockSchemas = sheet.blocks.map((block) => {
        if (block.type === "list") {
          const listBlock = block as ListBlock
          const properties: Record<string, any> = {}

          // Build properties from list items
          listBlock.items.forEach((item) => {
            if (item.key) {
              properties[item.key] = buildFieldSchema(item)
            }
          })

          return {
            type: "object",
            properties: {
              name: {
                type: "string",
                enum: [listBlock.name],
              },
              "@entity": {
                type: "string",
                enum: ["list"],
              },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties,
                  additionalProperties: false,
                },
              },
            },
            required: ["name", "@entity", "items"],
          }
        } else {
          const tableBlock = block as TableBlock
          const headerItems = tableBlock.headers.map((header) => ({
            type: "string",
            enum: [header.name || "unnamed"],
          }))

          const rowItems = tableBlock.headers.map((header) => buildFieldSchema(header))

          return {
            type: "object",
            properties: {
              name: {
                type: "string",
                enum: [tableBlock.name],
              },
              "@entity": {
                type: "string",
                enum: ["table"],
              },
              header: {
                type: "array",
                items: headerItems,
                additionalItems: false,
                minItems: tableBlock.headers.length,
                maxItems: tableBlock.headers.length,
              },
              rows: {
                type: "array",
                items: {
                  type: "array",
                  items: rowItems,
                  additionalItems: false,
                  minItems: tableBlock.headers.length,
                  maxItems: tableBlock.headers.length,
                },
              },
            },
            required: ["name", "@entity", "header", "rows"],
          }
        }
      })

      return {
        type: "object",
        properties: {
          name: {
            type: "string",
            enum: [sheet.name],
          },
          "@entity": {
            type: "string",
            enum: ["sheet"],
          },
          blocks: {
            type: "array",
            items: {
              oneOf: blockSchemas,
            },
          },
        },
        required: ["name", "@entity", "blocks"],
      }
    })

    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        name: {
          type: "string",
          enum: [activeWorkbook.name],
        },
        "@entity": {
          type: "string",
          enum: ["workbook"],
        },
        sheets: {
          type: "array",
          items: {
            oneOf: sheetSchemas,
          },
        },
      },
      required: ["name", "@entity", "sheets"],
    }

    return schema
  }

  const copyToClipboard = async () => {
    const schema = generateJsonSchema()
    if (schema) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(schema, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy to clipboard:", err)
      }
    }
  }

  const exportSchema = async () => {
    const schema = generateJsonSchema()
    if (schema) {
      const jsonString = JSON.stringify(schema, null, 2)
      const fileName = `${schema.properties.name.enum[0] || "schema"}.json`

      // Check if the File System Access API is available
      if ("showSaveFilePicker" in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "JSON Files",
                accept: { "application/json": [".json"] },
              },
            ],
          })

          const writable = await fileHandle.createWritable()
          await writable.write(jsonString)
          await writable.close()
        } catch (err) {
          // User cancelled or API failed, fall back to download
          console.error("File System Access API failed:", err)
          downloadFile(jsonString, fileName)
        }
      } else {
        // Fall back to traditional download if File System Access API is not available
        downloadFile(jsonString, fileName)
      }
    }
  }

  // Helper function for traditional file download
  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const schema = generateJsonSchema()

  return (
    <div className="flex space-x-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={!schema}>
            <Eye className="w-4 h-4 mr-2" />
            View Schema
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              JSON Schema Preview
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {schema ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Workbook: <span className="font-medium">{schema.properties.name.enum[0]}</span>
                  </p>
                  <div className="flex space-x-2">
                    <Button onClick={copyToClipboard} size="sm" variant="outline">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Schema
                        </>
                      )}
                    </Button>
                    <Button onClick={exportSchema} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Schema
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg">
                  <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                    {JSON.stringify(schema, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No schema available. Create some blocks to generate a schema.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
