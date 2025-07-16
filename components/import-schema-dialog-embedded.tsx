"use client"

import type React from "react"

import { useState } from "react"
import { Link, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSchemaStore } from "@/store/schema-store"
import type { ListBlock, TableBlock, KeyValuePair, TableHeader } from "@/types/schema"

interface ImportSchemaDialogEmbeddedProps {
  onClose: () => void
}

export function ImportSchemaDialogEmbedded({ onClose }: ImportSchemaDialogEmbeddedProps) {
  const { createWorkbook, createSheet, createBlock } = useSchemaStore()
  const [pastedSchema, setPastedSchema] = useState("")
  const [schemaUrl, setSchemaUrl] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const parseAndImportSchema = async (schemaText: string) => {
    setIsLoading(true)
    try {
      const schema = JSON.parse(schemaText)

      // Validate this is a JSON Schema
      if (!schema.$schema || !schema.properties) {
        throw new Error("Invalid JSON Schema format. Expected schema with $schema and properties.")
      }

      // Extract workbook name and validate structure
      const workbookNameEnum = schema.properties.name?.enum
      const workbookEntityEnum = schema.properties["@entity"]?.enum
      const sheetsProperty = schema.properties.sheets

      if (!workbookNameEnum || !workbookEntityEnum || workbookEntityEnum[0] !== "workbook" || !sheetsProperty) {
        throw new Error("Invalid workbook schema structure.")
      }

      const workbookName = workbookNameEnum[0]

      // Create workbook
      createWorkbook(workbookName)

      // Wait for workbook creation
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Get the newly created workbook
      let currentWorkbooks = useSchemaStore.getState().workbooks
      const newWorkbook = currentWorkbooks[currentWorkbooks.length - 1]

      if (!newWorkbook) {
        throw new Error("Failed to create workbook")
      }

      // Process sheets
      const sheetSchemas = sheetsProperty.items?.oneOf || []

      for (let sheetIndex = 0; sheetIndex < sheetSchemas.length; sheetIndex++) {
        const sheetSchema = sheetSchemas[sheetIndex]

        const sheetNameEnum = sheetSchema.properties?.name?.enum
        const sheetEntityEnum = sheetSchema.properties?.["@entity"]?.enum
        const blocksProperty = sheetSchema.properties?.blocks

        if (!sheetNameEnum || !sheetEntityEnum || sheetEntityEnum[0] !== "sheet") {
          continue
        }

        const sheetName = sheetNameEnum[0]

        // Create sheet
        createSheet(newWorkbook.id, sheetName)

        // Wait for sheet creation
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Refresh workbooks state and get the updated workbook
        currentWorkbooks = useSchemaStore.getState().workbooks
        const updatedWorkbook = currentWorkbooks.find((wb) => wb.id === newWorkbook.id)
        const newSheet = updatedWorkbook?.sheets[updatedWorkbook.sheets.length - 1]

        if (!newSheet) {
          continue
        }

        // Process blocks for this sheet
        if (blocksProperty && blocksProperty.items && blocksProperty.items.oneOf) {
          const blockSchemas = blocksProperty.items.oneOf

          for (let blockIndex = 0; blockIndex < blockSchemas.length; blockIndex++) {
            const blockSchema = blockSchemas[blockIndex]

            const blockNameEnum = blockSchema.properties?.name?.enum
            const blockEntityEnum = blockSchema.properties?.["@entity"]?.enum

            if (!blockNameEnum || !blockEntityEnum) {
              continue
            }

            const blockName = blockNameEnum[0]
            const blockType = blockEntityEnum[0]

            if (blockType === "list") {
              // Process list block
              const listBlock: ListBlock = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                type: "list",
                name: blockName,
                items: [],
              }

              // Extract field definitions from items.items.properties
              const itemsProperty = blockSchema.properties?.items
              const itemProperties = itemsProperty?.items?.properties

              if (itemProperties) {
                Object.entries(itemProperties).forEach(([fieldName, fieldSchema]: [string, any]) => {
                  const item: KeyValuePair = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    key: fieldName,
                    value: fieldSchema.examples?.[0] || "",
                    type: Array.isArray(fieldSchema.type) ? fieldSchema.type[0] : fieldSchema.type || "string",
                    nullAllowed: Array.isArray(fieldSchema.type) && fieldSchema.type.includes("null"),
                    description: fieldSchema.description,
                    examples: fieldSchema.examples,
                    pattern: fieldSchema.pattern,
                    minLength: fieldSchema.minLength,
                    maxLength: fieldSchema.maxLength,
                    minimum: fieldSchema.minimum,
                    maximum: fieldSchema.maximum,
                    enum: fieldSchema.enum,
                    format: fieldSchema.format
                      ? fieldSchema.format === "Long"
                        ? "Long"
                        : fieldSchema.format === "BigDecimal"
                          ? "BigDecimal"
                          : undefined
                      : undefined,
                  }
                  listBlock.items.push(item)
                })
              }

              createBlock(newWorkbook.id, newSheet.id, listBlock)
            } else if (blockType === "table") {
              // Process table block
              const tableBlock: TableBlock = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                type: "table",
                name: blockName,
                headers: [],
                rows: [],
              }

              // Extract header definitions
              const headerProperty = blockSchema.properties?.header
              const rowsProperty = blockSchema.properties?.rows

              if (headerProperty?.items && rowsProperty?.items?.items) {
                const headerItems = headerProperty.items
                const rowItems = rowsProperty.items.items

                headerItems.forEach((headerItem: any, index: number) => {
                  const headerName = headerItem.enum?.[0] || `column_${index + 1}`
                  const rowFieldSchema = rowItems[index] || {}

                  const header: TableHeader = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: headerName,
                    type: Array.isArray(rowFieldSchema.type) ? rowFieldSchema.type[0] : rowFieldSchema.type || "string",
                    nullAllowed: Array.isArray(rowFieldSchema.type) && rowFieldSchema.type.includes("null"),
                    description: rowFieldSchema.description,
                    examples: rowFieldSchema.examples,
                    pattern: rowFieldSchema.pattern,
                    minLength: rowFieldSchema.minLength,
                    maxLength: rowFieldSchema.maxLength,
                    minimum: rowFieldSchema.minimum,
                    maximum: rowFieldSchema.maximum,
                    enum: rowFieldSchema.enum,
                    format: rowFieldSchema.format
                      ? rowFieldSchema.format === "Long"
                        ? "Long"
                        : rowFieldSchema.format === "BigDecimal"
                          ? "BigDecimal"
                          : undefined
                      : undefined,
                  }
                  tableBlock.headers.push(header)
                })
              }

              createBlock(newWorkbook.id, newSheet.id, tableBlock)
            }

            // Small delay between block creations
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        // Small delay between sheet processing
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setError("")
      onClose()
      setPastedSchema("")
      setSchemaUrl("")
    } catch (err) {
      console.error("Import error:", err)
      setError(err instanceof Error ? err.message : "Failed to parse schema")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasteImport = () => {
    if (!pastedSchema.trim()) {
      setError("Please paste a schema to import")
      return
    }
    parseAndImportSchema(pastedSchema)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      setError("Please select a JSON file")
      return
    }

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        parseAndImportSchema(content)
      }
    }
    reader.onerror = () => {
      setError("Failed to read file")
      setIsLoading(false)
    }
    reader.readAsText(file)
  }

  const handleUrlImport = async () => {
    if (!schemaUrl.trim()) {
      setError("Please enter a URL")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(schemaUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }

      const schemaText = await response.text()
      parseAndImportSchema(schemaText)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schema from URL")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paste">Paste</TabsTrigger>
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-4">
          <div>
            <Label htmlFor="schema-paste">Paste JSON Schema</Label>
            <Textarea
              id="schema-paste"
              placeholder="Paste your JSON schema here..."
              value={pastedSchema}
              onChange={(e) => setPastedSchema(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <Button onClick={handlePasteImport} className="w-full" disabled={!pastedSchema.trim() || isLoading}>
            <FileText className="w-4 h-4 mr-2" />
            {isLoading ? "Importing..." : "Import Schema"}
          </Button>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div>
            <Label htmlFor="schema-file">Select JSON Schema File</Label>
            <Input
              id="schema-file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="cursor-pointer"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-2">
              {isLoading ? "Processing file..." : "Select a JSON schema file from your computer"}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div>
            <Label htmlFor="schema-url">Schema URL</Label>
            <Input
              id="schema-url"
              type="url"
              placeholder="https://example.com/schema.json"
              value={schemaUrl}
              onChange={(e) => setSchemaUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && schemaUrl.trim() && handleUrlImport()}
            />
            <p className="text-sm text-gray-500 mt-2">Enter a URL to fetch the JSON schema from</p>
          </div>
          <Button onClick={handleUrlImport} disabled={isLoading || !schemaUrl.trim()} className="w-full">
            <Link className="w-4 h-4 mr-2" />
            {isLoading ? "Fetching..." : "Import from URL"}
          </Button>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
