"use client"

import type React from "react"
import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { FileSpreadsheet, Upload, Download, Settings, RefreshCw, AlertCircle, File, CheckCircle, X, Table, List, ChevronRight, ChevronDown, Database, LinkIcon, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { WorkbookData, SheetSchema, ValidationError, ColumnWidth } from "./types"
import { VirtualizedTable } from "./components/virtualized-table"
import { validateAllCells } from "./utils/validation"
import { AddDataDialog } from "./components/add-data-dialog"

function SheetVisualizerContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null)
  const [workbookSchema, setWorkbookSchema] = useState<SheetSchema | null>(null)
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const [activeBlockIndex, setActiveBlockIndex] = useState(0)
  const [error, setError] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState("")
  const [schemaInput, setSchemaInput] = useState("")
  const [dataUrlInput, setDataUrlInput] = useState("")
  const [schemaUrlInput, setSchemaUrlInput] = useState("")
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [columnWidths, setColumnWidths] = useState<ColumnWidth>({})
  const [isResizing, setIsResizing] = useState<{ col: number; startX: number; startWidth: number } | null>(null)
  const [expandedSheets, setExpandedSheets] = useState<Set<number>>(new Set([0]))
  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false)
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const schemaFileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")

  // Handle query parameters for auto-import
  useEffect(() => {
    const dataUrl = searchParams.get("data_url")
    const schemaUrl = searchParams.get("schema_url")

    const autoImport = async () => {
      if (schemaUrl) {
        await handleSchemaUrlImport(schemaUrl)
      }
      if (dataUrl) {
        await handleDataUrlImport(dataUrl)
      }
    }

    if (dataUrl || schemaUrl) {
      autoImport()
    }
  }, [searchParams])

  // Run validation when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (workbookData && workbookSchema) {
        const allErrors: ValidationError[] = []

        // Validate all sheets and blocks using indices
        workbookData.sheets.forEach((sheet, sheetIndex) => {
          sheet.blocks.forEach((block, blockIndex) => {
            const errors = validateAllCells(workbookData, workbookSchema, sheetIndex, blockIndex)
            // Add sheet and block names to errors for filtering
            const errorsWithNames = errors.map((error) => ({
              ...error,
              sheetName: sheet.name,
              blockName: block.name,
              sheetIndex,
              blockIndex,
            }))
            allErrors.push(...errorsWithNames)
          })
        })

        setValidationErrors(allErrors)
      } else {
        setValidationErrors([])
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [workbookData, workbookSchema])

  const toggleSheet = (sheetIndex: number) => {
    const newExpanded = new Set(expandedSheets)
    if (newExpanded.has(sheetIndex)) {
      newExpanded.delete(sheetIndex)
    } else {
      newExpanded.add(sheetIndex)
    }
    setExpandedSheets(newExpanded)
  }

  const handleDataImport = async (content: string) => {
    setIsLoading(true)
    setLoadingMessage("Importing data...")
    try {
      const parsedData = JSON.parse(content)
      validateAndSetData(parsedData)
      setJsonInput("")
      setIsDataDialogOpen(false)
    } catch (err) {
      setError("Invalid JSON data format")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleDataUrlImport = async (url: string) => {
    setIsLoading(true)
    setLoadingMessage("Fetching data from URL...")
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      const data = await response.json()
      validateAndSetData(data)
      setDataUrlInput("")
      setIsDataDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data from URL")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleSchemaImport = async (content: string) => {
    setIsLoading(true)
    setLoadingMessage("Importing schema...")
    try {
      const parsedData = JSON.parse(content)
      validateAndSetSchema(parsedData)
      setSchemaInput("")
      setIsSchemaDialogOpen(false)
    } catch (err) {
      setError("Invalid JSON schema format")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleSchemaUrlImport = async (url: string) => {
    setIsLoading(true)
    setLoadingMessage("Fetching schema from URL...")
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      const schema = await response.json()
      validateAndSetSchema(schema)
      setSchemaUrlInput("")
      setIsSchemaDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schema from URL")
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const handleDataFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setLoadingMessage("Loading data file...")

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        validateAndSetData(data)
        setIsDataDialogOpen(false)
      } catch (err) {
        setError("Invalid JSON data file format")
      } finally {
        setIsLoading(false)
        setLoadingMessage("")
      }
    }
    reader.readAsText(file)
  }

  const handleSchemaFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setLoadingMessage("Loading schema file...")

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        validateAndSetSchema(data)
        setIsSchemaDialogOpen(false)
      } catch (err) {
        setError("Invalid JSON schema file format")
      } finally {
        setIsLoading(false)
        setLoadingMessage("")
      }
    }
    reader.readAsText(file)
  }

  const validateAndSetSchema = (schema: any) => {
    setError("")

    // Basic schema validation
    if (!schema || typeof schema !== "object") {
      setError("Schema must be an object")
      return
    }

    if (!schema.properties || !schema.properties.sheets) {
      setError("Schema must have properties.sheets")
      return
    }

    setWorkbookSchema(schema)

    // If we already have data, just apply the schema for validation
    if (workbookData) {
      return
    }

    // Only create empty workbook structure if no data exists
    const workbookName = schema.properties.name?.enum?.[0] || "New Workbook"
    const sheets = schema.properties.sheets.items.oneOf.map((sheetSchema: any) => {
      const sheetName = sheetSchema.properties.name?.enum?.[0] || "New Sheet"
      const blocks = sheetSchema.properties.blocks.items.oneOf.map((blockSchema: any) => {
        const blockName = blockSchema.properties.name?.enum?.[0] || "New Block"
        const blockType = blockSchema.properties["@entity"].enum[0]

        if (blockType === "table") {
          const headers = blockSchema.properties.header?.items?.map((item: any) => item.enum?.[0] || "Column") || []
          return {
            name: blockName,
            "@entity": "table" as const,
            header: headers,
            rows: [],
          }
        } else {
          return {
            name: blockName,
            "@entity": "list" as const,
            items: [],
          }
        }
      })

      return {
        name: sheetName,
        "@entity": "sheet" as const,
        blocks,
      }
    })

    const newWorkbook: WorkbookData = {
      name: workbookName,
      "@entity": "workbook",
      sheets,
    }

    setWorkbookData(newWorkbook)
    setActiveSheetIndex(0)
    setActiveBlockIndex(0)
    setColumnWidths({})
  }

  const validateAndSetData = (data: any) => {
    setError("")

    // Validate basic structure
    if (!data || typeof data !== "object") {
      setError("Data must be an object")
      return
    }

    if (data["@entity"] !== "workbook" || !data.sheets || !Array.isArray(data.sheets)) {
      setError("Data must be a valid workbook with sheets array")
      return
    }

    // Validate sheets
    for (const sheet of data.sheets) {
      if (sheet["@entity"] !== "sheet" || !sheet.blocks || !Array.isArray(sheet.blocks)) {
        setError("Each sheet must have a blocks array")
        return
      }
    }

    setWorkbookData(data)
    setActiveSheetIndex(0)
    setActiveBlockIndex(0)
    setColumnWidths({})
    setExpandedSheets(new Set([0]))
  }

  const exportData = () => {
    if (!workbookData) return

    const blob = new Blob([JSON.stringify(workbookData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${workbookData.name || "workbook"}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const removeSchema = () => {
    setWorkbookSchema(null)
    setValidationErrors([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete("schema_url")
    router.replace(`${pathname}?${params.toString()}`)
  }

  const clearAll = () => {
    setWorkbookData(null)
    setWorkbookSchema(null)
    setValidationErrors([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete("data_url")
    params.delete("schema_url")
    router.replace(`${pathname}?${params.toString()}`)
  }

  const currentSheet = workbookData?.sheets[activeSheetIndex]
  const currentBlock = currentSheet?.blocks[activeBlockIndex]

  // Filter validation errors for current block
  const currentBlockErrors = validationErrors.filter(
    (error: any) => error.sheetIndex === activeSheetIndex && error.blockIndex === activeBlockIndex,
  )

  // Get sheets and blocks with errors for highlighting
  const sheetsWithErrors = new Set(validationErrors.map((error: any) => error.sheetIndex))
  const blocksWithErrors = new Set(validationErrors.map((error: any) => `${error.sheetIndex}-${error.blockIndex}`))

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white border-b flex-shrink-0 z-10">
        <div className="mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Sheet Tools</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Sheet Visualizer</span>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/sheet-schema-builder">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Schema Builder
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sticky Sidebar */}
        <div className="w-96 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Import Buttons */}
              <div className="flex gap-4">
                {/* Import Data Button */}
                <Dialog open={isDataDialogOpen} onOpenChange={setIsDataDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Database className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Import Sheet Data</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="file" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="file">File Upload</TabsTrigger>
                        <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                        <TabsTrigger value="url">From URL</TabsTrigger>
                      </TabsList>

                      <TabsContent value="file" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-base font-medium">Upload Data File</Label>
                            <p className="text-sm text-gray-500 mb-3">Upload your sheet data JSON file</p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".json"
                              onChange={handleDataFileUpload}
                              className="hidden"
                            />
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              variant="outline"
                              className="w-full h-32 border-dashed"
                              disabled={isLoading}
                            >
                              <div className="flex flex-col items-center">
                                <File className="w-8 h-8 mb-2 text-gray-400" />
                                <span>{isLoading ? "Loading..." : "Click to choose JSON file"}</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="paste" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Paste JSON Data</Label>
                            <Textarea
                              placeholder="Paste your sheet-js compatible JSON here..."
                              value={jsonInput}
                              onChange={(e) => setJsonInput(e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={() => handleDataImport(jsonInput)}
                              disabled={isLoading || !jsonInput.trim()}
                            >
                              {isLoading ? "Importing..." : "Import Data"}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Data URL</Label>
                            <Input
                              placeholder="https://example.com/data.json"
                              value={dataUrlInput}
                              onChange={(e) => setDataUrlInput(e.target.value)}
                            />
                            <p className="text-sm text-gray-500 mt-1">Enter a URL to fetch the JSON data from</p>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={() => handleDataUrlImport(dataUrlInput)}
                              disabled={isLoading || !dataUrlInput.trim()}
                            >
                              {isLoading ? "Fetching..." : "Fetch Data"}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Import Schema Button */}
                <Dialog open={isSchemaDialogOpen} onOpenChange={setIsSchemaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Import Schema
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Import Validation Schema</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="file" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="file">File Upload</TabsTrigger>
                        <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                        <TabsTrigger value="url">From URL</TabsTrigger>
                      </TabsList>

                      <TabsContent value="file" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-base font-medium">Upload Schema File</Label>
                            <p className="text-sm text-gray-500 mb-3">Upload your JSON schema file</p>
                            <input
                              ref={schemaFileInputRef}
                              type="file"
                              accept=".json"
                              onChange={handleSchemaFileUpload}
                              className="hidden"
                            />
                            <Button
                              onClick={() => schemaFileInputRef.current?.click()}
                              variant="outline"
                              className="w-full h-32 border-dashed"
                              disabled={isLoading}
                            >
                              <div className="flex flex-col items-center">
                                <FileSpreadsheet className="w-8 h-8 mb-2 text-gray-400" />
                                <span>{isLoading ? "Loading..." : "Click to choose Schema file"}</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="paste" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Paste JSON Schema</Label>
                            <Textarea
                              placeholder="Paste your JSON schema here..."
                              value={schemaInput}
                              onChange={(e) => setSchemaInput(e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={() => handleSchemaImport(schemaInput)}
                              disabled={isLoading || !schemaInput.trim()}
                            >
                              {isLoading ? "Importing..." : "Import Schema"}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Schema URL</Label>
                            <Input
                              placeholder="https://example.com/schema.json"
                              value={schemaUrlInput}
                              onChange={(e) => setSchemaUrlInput(e.target.value)}
                            />
                            <p className="text-sm text-gray-500 mt-1">Enter a URL to fetch the JSON schema from</p>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={() => handleSchemaUrlImport(schemaUrlInput)}
                              disabled={isLoading || !schemaUrlInput.trim()}
                            >
                              {isLoading ? "Fetching..." : "Fetch Schema"}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {workbookData && (
              <div className="flex items-center space-x-2">
                {workbookSchema && (
                  <Button variant="outline" size="sm" onClick={removeSchema}>
                    <X className="w-4 h-4 mr-1" />
                    Remove Schema
                  </Button>
                )}
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Workbook Navigation */}
          <div className="flex-1 overflow-y-auto">
            {workbookData ? (
              <div className="p-4">
                <div className="space-y-4">
                  {/* Workbook Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{workbookData.name}</h3>
                      {workbookSchema && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Schema
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {workbookData.sheets.length} sheet(s) •{" "}
                      {workbookData.sheets.reduce((acc, sheet) => acc + sheet.blocks.length, 0)} block(s)
                    </p>
                    {validationErrors.length > 0 && (
                      <p className="text-sm text-red-600">{validationErrors.length} validation error(s)</p>
                    )}
                  </div>

                  {/* Sheets */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Sheets</h4>
                    {workbookData.sheets.map((sheet, sheetIndex) => {
                      const hasSheetErrors = sheetsWithErrors.has(sheetIndex)

                      return (
                        <div key={sheetIndex} className="space-y-1">
                          <div
                            className={cn(
                              "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100",
                              activeSheetIndex === sheetIndex && "bg-blue-100",
                              hasSheetErrors && "bg-red-50 border border-red-200",
                            )}
                            onClick={() => {
                              setActiveSheetIndex(sheetIndex)
                              toggleSheet(sheetIndex)
                              setActiveBlockIndex(0)
                              setSelectedCell(null)
                              setEditingCell(null)
                            }}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              {expandedSheets.has(sheetIndex) ? (
                                <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0" />
                              )}
                              <Table className="w-3 h-3 mr-2 flex-shrink-0" />
                              <span className="text-sm truncate">{sheet.name}</span>
                              {hasSheetErrors && <AlertCircle className="w-3 h-3 ml-1 text-red-500 flex-shrink-0" />}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {sheet.blocks.length}
                            </Badge>
                          </div>

                          {/* Blocks */}
                          {expandedSheets.has(sheetIndex) && (
                            <div className="ml-6 space-y-1">
                              {sheet.blocks.map((block, blockIndex) => {
                                const blockKey = `${sheetIndex}-${blockIndex}`
                                const hasBlockErrors = blocksWithErrors.has(blockKey)

                                return (
                                  <div
                                    key={blockIndex}
                                    className={cn(
                                      "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50",
                                      activeSheetIndex === sheetIndex &&
                                        activeBlockIndex === blockIndex &&
                                        "bg-blue-50 border border-blue-200",
                                      hasBlockErrors && "bg-red-50 border border-red-200",
                                    )}
                                    onClick={() => {
                                      setActiveSheetIndex(sheetIndex)
                                      setActiveBlockIndex(blockIndex)
                                      setSelectedCell(null)
                                      setEditingCell(null)
                                      setColumnWidths({})
                                    }}
                                  >
                                    <div className="flex items-center flex-1 min-w-0">
                                      {block["@entity"] === "list" ? (
                                        <List className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                                      ) : (
                                        <Table className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                                      )}
                                      <span className="text-sm text-gray-700 truncate mr-2">{block.name}</span>
                                      {hasBlockErrors && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {block["@entity"] === "table"
                                        ? `${block.rows?.length || 0} rows`
                                        : `${block.items?.length || 0} items`}
                                    </Badge>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-gray-500">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-3">No data imported</p>
                  <Button size="sm" variant="outline" onClick={() => setIsDataDialogOpen(true)}>
                    <Upload className="w-3 h-3 mr-1" />
                    Import Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {workbookData && currentBlock ? (
            <>
              {/* Block Header */}
              <div className="bg-white border-b p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      {currentBlock["@entity"] === "list" ? (
                        <List className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Table className="w-5 h-5 text-gray-500" />
                      )}
                      <h1 className="text-xl font-semibold">{currentBlock.name}</h1>
                      <Badge variant="outline">{currentBlock["@entity"]}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentSheet?.name} •{" "}
                      {currentBlock["@entity"] === "table"
                        ? `${currentBlock.rows?.length || 0} rows, ${currentBlock.header?.length || 0} columns`
                        : `${currentBlock.items?.length || 0} items`}
                      {currentBlockErrors.length > 0 && (
                        <span className="ml-2 text-red-600">• {currentBlockErrors.length} error(s)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Add Data Dialog - now works with or without schema */}
                    <AddDataDialog
                      currentBlock={currentBlock}
                      currentSheetName={currentSheet?.name || ""}
                      workbookSchema={workbookSchema}
                      onAddData={(newRowData) => {
                        if (!workbookData) return

                        const newData = { ...workbookData }
                        const sheet = newData.sheets[activeSheetIndex]
                        const block = sheet.blocks[activeBlockIndex]

                        if (block["@entity"] === "table") {
                          if (!block.rows) block.rows = []
                          block.rows.push(newRowData)
                        } else if (block["@entity"] === "list") {
                          if (!block.items) block.items = []
                          block.items.push(newRowData)
                        }

                        setWorkbookData(newData)
                      }}
                    />
                  </div>
                </div>

                {/* Validation Errors for Current Block */}
                {currentBlockErrors.length > 0 && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Found {currentBlockErrors.length} validation error(s) in this block. Check cells with red
                      backgrounds for details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-hidden p-4">
                <VirtualizedTable
                  currentBlock={currentBlock}
                  workbookSchema={workbookSchema}
                  currentSheetName={currentSheet?.name || ""}
                  currentBlockName={currentBlock.name}
                  validationErrors={currentBlockErrors}
                  selectedCell={selectedCell}
                  editingCell={editingCell}
                  editingValue={editingValue}
                  columnWidths={columnWidths}
                  isResizing={isResizing}
                  onCellClick={(row, col) => {
                    setSelectedCell({ row, col })
                    setEditingCell(null)
                  }}
                  onCellDoubleClick={(row, col, value) => {
                    if (currentBlock["@entity"] === "table") {
                      setEditingCell({ row, col })
                      setEditingValue(String(value || ""))
                      setSelectedCell({ row, col })
                    }
                  }}
                  onEditingValueChange={setEditingValue}
                  onCellEdit={(newValue) => {
                    if (!workbookData || !editingCell) return

                    const newData = { ...workbookData }
                    const sheet = newData.sheets[activeSheetIndex]
                    const block = sheet.blocks[activeBlockIndex]

                    if (block["@entity"] === "table" && block.rows) {
                      if (!block.rows[editingCell.row]) {
                        block.rows[editingCell.row] = []
                      }
                      block.rows[editingCell.row][editingCell.col] = newValue
                    } else if (block["@entity"] === "list" && block.items) {
                      // For list blocks, we need to handle the flattened structure
                      const listData = block.items.flatMap((item: any, itemIndex: number) => {
                        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
                          return Object.entries(item).map(([key, value]) => ({
                            key,
                            value,
                            itemIndex,
                            originalKey: key,
                          }))
                        }
                        if (Array.isArray(item)) {
                          return item.map((value: any, idx: number) => ({
                            key: `Item ${idx + 1}`,
                            value,
                            itemIndex,
                            arrayIndex: idx,
                          }))
                        }
                        return [{ key: "Value", value: item, itemIndex }]
                      })

                      const rowData = listData[editingCell.row]
                      if (rowData) {
                        const originalItem = block.items[rowData.itemIndex]

                        if (editingCell.col === 0) {
                          // Editing key - only for object items
                          if (
                            typeof originalItem === "object" &&
                            originalItem !== null &&
                            !Array.isArray(originalItem)
                          ) {
                            const newItem = { ...originalItem }
                            delete newItem[rowData.originalKey]
                            newItem[newValue] = rowData.value
                            block.items[rowData.itemIndex] = newItem
                          }
                        } else {
                          // Editing value
                          if (
                            typeof originalItem === "object" &&
                            originalItem !== null &&
                            !Array.isArray(originalItem)
                          ) {
                            block.items[rowData.itemIndex] = { ...originalItem, [rowData.originalKey]: newValue }
                          } else if (Array.isArray(originalItem)) {
                            const newArray = [...originalItem]
                            newArray[rowData.arrayIndex] = newValue
                            block.items[rowData.itemIndex] = newArray
                          } else {
                            block.items[rowData.itemIndex] = newValue
                          }
                        }
                      }
                    }

                    setWorkbookData(newData)
                    setEditingCell(null)
                    setEditingValue("")
                    setError("")
                  }}
                  onCancelEdit={() => {
                    setEditingCell(null)
                    setError("")
                  }}
                  onColumnResize={(colIndex, startX, startWidth) => {
                    setIsResizing({ col: colIndex, startX, startWidth })
                  }}
                  onColumnResizeEnd={() => {
                    setIsResizing(null)
                  }}
                  onColumnWidthChange={setColumnWidths}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold mb-2">Ready to Import Your Data</h2>
                <p className="text-gray-600 mb-4">Upload your sheet to begin exploring, visualizing, and editing your data.</p>
                <Button onClick={() => setIsDataDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SheetVisualizerPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <SheetVisualizerContent />
    </Suspense>
  )
}
