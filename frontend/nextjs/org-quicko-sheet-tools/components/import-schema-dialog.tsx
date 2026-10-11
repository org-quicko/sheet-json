"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Link, FileText, Upload, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { importSchemaFromUrl, extractWorkbookNameFromSchema, WorkbookNameConflictError } from "@/lib/import-schema"
import { workbookNameExistsInStorage } from "@/lib/workbook-storage"
import { OverwriteWorkbookDialog } from "@/components/overwrite-workbook-dialog"
import { cn } from "@/lib/utils"
import type { ListBlock, TableBlock, KeyValuePair, TableHeader } from "@/types/schema"
import { useSchemaStore } from "@/store/schema-store"

type ImportSchemaDialogProps = {
  onClose?: () => void
}

// A pending import waiting on user confirmation to overwrite an existing workbook.
type PendingImport = { source: "text"; schemaText: string } | { source: "url"; url: string }

export function ImportSchemaDialog({ onClose }: ImportSchemaDialogProps) {
  const { createWorkbook, deleteWorkbookByName, createSheet, createBlock } = useSchemaStore()
  const [pastedSchema, setPastedSchema] = useState("")
  const [schemaUrl, setSchemaUrl] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [conflictWorkbookName, setConflictWorkbookName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("schema-import-loading", { detail: { isLoading } })
      window.dispatchEvent(event)
    }
  }, [isLoading])

  const parseAndImportSchema = async (schemaText: string, overwrite = false) => {
    setIsLoading(true)
    try {
      const schema = JSON.parse(schemaText)
      const sheetsProperty = schema.properties?.sheets
      const workbookName = extractWorkbookNameFromSchema(schema)

      if (!overwrite && (await workbookNameExistsInStorage(workbookName))) {
        setIsLoading(false)
        setPendingImport({ source: "text", schemaText })
        setConflictWorkbookName(workbookName)
        return
      }

      if (overwrite) {
        deleteWorkbookByName(workbookName)
      }

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

      let totalBlocksCreated = 0
      const importSummary: string[] = []

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
          importSummary.push(`❌ Failed to create sheet: ${sheetName}`)
          continue
        }

        let sheetBlocksCreated = 0

        // Process blocks for this sheet
        if (blocksProperty && blocksProperty.items && blocksProperty.items.oneOf) {
          const blockSchemas = blocksProperty.items.oneOf

          if (blockSchemas.length === 0) {
            importSummary.push(`⚠️ Sheet "${sheetName}" created with no blocks (none defined in schema)`)
          }

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
              sheetBlocksCreated++
              totalBlocksCreated++
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
              sheetBlocksCreated++
              totalBlocksCreated++
            }

            // Small delay between block creations
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        } else {
          importSummary.push(`⚠️ Sheet "${sheetName}" created with no blocks (no blocks property in schema)`)
        }

        if (sheetBlocksCreated > 0) {
          importSummary.push(`✅ Sheet "${sheetName}" created with ${sheetBlocksCreated} block(s)`)
        }

        // Small delay between sheet processing
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setError("")
      if (onClose) {
        onClose()
      }
      setPastedSchema("")
      setSchemaUrl("")
      setSelectedFile(null)
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

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setError("Please select a JSON file")
      return
    }

    setSelectedFile(file)
    setError("")

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find((file) => file.name.endsWith(".json"))

    if (jsonFile) {
      handleFileSelect(jsonFile)
    } else {
      setError("Please drop a JSON file")
    }
  }

  const handleUrlImport = async (overwrite = false) => {
    if (!schemaUrl.trim()) {
      setError("Please enter a URL")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await importSchemaFromUrl(schemaUrl, { overwrite })

      setError("")
      if (onClose) {
        onClose()
      }
      setPastedSchema("")
      setSchemaUrl("")
      setSelectedFile(null)
    } catch (err) {
      if (err instanceof WorkbookNameConflictError) {
        setIsLoading(false)
        setPendingImport({ source: "url", url: schemaUrl })
        setConflictWorkbookName(err.workbookName)
        return
      }
      setError(err instanceof Error ? err.message : "Failed to fetch schema from URL")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmOverwrite = () => {
    const pending = pendingImport
    setPendingImport(null)
    setConflictWorkbookName(null)
    if (!pending) return

    if (pending.source === "text") {
      parseAndImportSchema(pending.schemaText, true)
    } else {
      handleUrlImport(true)
    }
  }

  const handleCancelOverwrite = () => {
    setPendingImport(null)
    setConflictWorkbookName(null)
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="relative bg-white rounded-lg shadow-lg p-8 mx-4 max-w-sm w-full pointer-events-auto">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Importing Schema</h3>
                <p className="text-sm text-gray-600 mt-1">Processing your JSON schema...</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              disabled={isLoading}
            />
          </div>
          <Button onClick={handlePasteImport} className="w-full" disabled={!pastedSchema.trim() || isLoading}>
            <FileText className="w-4 h-4 mr-2" />
            {isLoading ? "Importing..." : "Import Schema"}
          </Button>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div>
            <Label>Upload JSON Schema File</Label>
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                isLoading && "pointer-events-none opacity-50",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-green-700">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    {!isLoading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearSelectedFile()
                        }}
                        className="ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {isLoading && <p className="text-sm text-blue-600">Processing file...</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragOver ? "Drop your JSON file here" : "Drop JSON file here or click to browse"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {isLoading ? "Processing..." : "Supports .json files"}
                    </p>
                  </div>
                </div>
              )}
            </div>
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
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-2">Enter a URL to fetch the JSON schema from</p>
          </div>
          <Button onClick={() => handleUrlImport()} disabled={isLoading || !schemaUrl.trim()} className="w-full">
            <Link className="w-4 h-4 mr-2" />
            {isLoading ? "Fetching..." : "Import from URL"}
          </Button>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <OverwriteWorkbookDialog
        open={pendingImport !== null && conflictWorkbookName !== null}
        workbookName={conflictWorkbookName ?? ""}
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />
    </>
  )
}
