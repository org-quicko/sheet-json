"use client"

import type React from "react"
import { createPortal } from "react-dom"

import { useState, useEffect } from "react"
import {
  Plus,
  Table,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit2,
  List,
  FileText,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Copy,
  Check,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useSchemaStore } from "@/store/schema-store"
import { cn } from "@/lib/utils"
import type { ListBlock, TableBlock, KeyValuePair, TableHeader } from "@/types/schema"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ImportSchemaDialog } from "./import-schema-dialog"
import { WorkbookCombobox } from "./workbook-combobox"
import { useResizableSidebar } from "@/hooks/use-resizable-sidebar"

export function Sidebar() {
  const {
    workbooks,
    activeWorkbookId,
    activeSheetId,
    activeBlockId,
    createWorkbook,
    deleteWorkbook,
    updateWorkbook,
    setActiveWorkbook,
    createSheet,
    deleteSheet,
    setActiveSheet,
    setActiveBlock,
    updateSheet,
    updateBlock,
    deleteBlock,
    copySheet,
    copyBlock,
    reorderSheets,
    reorderBlocks,
  } = useSchemaStore()

  const [newWorkbookName, setNewWorkbookName] = useState("")
  const [newSheetName, setNewSheetName] = useState("")
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set())
  const [isWorkbookDialogOpen, setIsWorkbookDialogOpen] = useState(false)
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false)
  const [editingSheet, setEditingSheet] = useState<string | null>(null)
  const [editingSheetName, setEditingSheetName] = useState("")
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [editingBlockName, setEditingBlockName] = useState("")
  const [copied, setCopied] = useState(false)

  const [isEditWorkbookDialogOpen, setIsEditWorkbookDialogOpen] = useState(false)
  const [isDeleteWorkbookDialogOpen, setIsDeleteWorkbookDialogOpen] = useState(false)
  const [isDeleteSheetDialogOpen, setIsDeleteSheetDialogOpen] = useState(false)
  const [isDeleteBlockDialogOpen, setIsDeleteBlockDialogOpen] = useState(false)
  const [editingWorkbookName, setEditingWorkbookName] = useState("")
  const [deletingSheet, setDeletingSheet] = useState<{ workbookId: string; sheetId: string; sheetName: string } | null>(
    null,
  )
  const [deletingBlock, setDeletingBlock] = useState<{
    workbookId: string
    sheetId: string
    blockId: string
    blockName: string
  } | null>(null)

  // Drag and drop state
  const [draggedSheet, setDraggedSheet] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [dragOverSheet, setDragOverSheet] = useState<string | null>(null)
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null)
  const [isImportLoading, setIsImportLoading] = useState(false)

  const { width: sidebarWidth, isResizing, handlePointerDown, resetWidth } = useResizableSidebar()

  // Listen for import loading state to blur the entire background (excluding dialog)
  useEffect(() => {
    const handler = (event: any) => {
      if (event && event.detail && typeof event.detail.isLoading === "boolean") {
        setIsImportLoading(event.detail.isLoading)
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("schema-import-loading", handler as EventListener)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("schema-import-loading", handler as EventListener)
      }
    }
  }, [])

  const activeWorkbook = workbooks.find((wb) => wb.id === activeWorkbookId)

  const toggleSheet = (sheetId: string) => {
    const newExpanded = new Set(expandedSheets)
    if (newExpanded.has(sheetId)) {
      newExpanded.delete(sheetId)
    } else {
      newExpanded.add(sheetId)
    }
    setExpandedSheets(newExpanded)
  }

  const handleCreateWorkbook = () => {
    if (newWorkbookName.trim()) {
      createWorkbook(newWorkbookName.trim())
      setNewWorkbookName("")
      setIsWorkbookDialogOpen(false)
    }
  }

  const handleCreateSheet = () => {
    if (newSheetName.trim() && activeWorkbookId) {
      createSheet(activeWorkbookId, newSheetName.trim())
      setNewSheetName("")
      setIsSheetDialogOpen(false)
    }
  }

  const handleDeleteWorkbook = () => {
    setIsDeleteWorkbookDialogOpen(true)
  }

  const confirmDeleteWorkbook = () => {
    if (activeWorkbookId) {
      deleteWorkbook(activeWorkbookId)
    }
    setIsDeleteWorkbookDialogOpen(false)
  }

  const handleDeleteSheet = (workbookId: string, sheetId: string, sheetName: string) => {
    setDeletingSheet({ workbookId, sheetId, sheetName })
    setIsDeleteSheetDialogOpen(true)
  }

  const confirmDeleteSheet = () => {
    if (deletingSheet) {
      deleteSheet(deletingSheet.workbookId, deletingSheet.sheetId)
    }
    setIsDeleteSheetDialogOpen(false)
    setDeletingSheet(null)
  }

  const handleDeleteBlock = (workbookId: string, sheetId: string, blockId: string, blockName: string) => {
    setDeletingBlock({ workbookId, sheetId, blockId, blockName })
    setIsDeleteBlockDialogOpen(true)
  }

  const confirmDeleteBlock = () => {
    if (deletingBlock) {
      deleteBlock(deletingBlock.workbookId, deletingBlock.sheetId, deletingBlock.blockId)
    }
    setIsDeleteBlockDialogOpen(false)
    setDeletingBlock(null)
  }

  // Drag and drop handlers for sheets
  const handleSheetDragStart = (e: React.DragEvent, sheetId: string) => {
    setDraggedSheet(sheetId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleSheetDragOver = (e: React.DragEvent, sheetId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverSheet(sheetId)
  }

  const handleSheetDragLeave = () => {
    setDragOverSheet(null)
  }

  const handleSheetDrop = (e: React.DragEvent, targetSheetId: string) => {
    e.preventDefault()
    if (draggedSheet && draggedSheet !== targetSheetId && activeWorkbook) {
      const fromIndex = activeWorkbook.sheets.findIndex((s) => s.id === draggedSheet)
      const toIndex = activeWorkbook.sheets.findIndex((s) => s.id === targetSheetId)

      if (fromIndex !== -1 && toIndex !== -1) {
        reorderSheets(activeWorkbook.id, fromIndex, toIndex)
      }
    }
    setDraggedSheet(null)
    setDragOverSheet(null)
  }

  const handleSheetDragEnd = () => {
    setDraggedSheet(null)
    setDragOverSheet(null)
  }

  // Drag and drop handlers for blocks
  const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleBlockDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverBlock(blockId)
  }

  const handleBlockDragLeave = () => {
    setDragOverBlock(null)
  }

  const handleBlockDrop = (e: React.DragEvent, targetBlockId: string, sheetId: string) => {
    e.preventDefault()
    if (draggedBlock && draggedBlock !== targetBlockId && activeWorkbook) {
      const sheet = activeWorkbook.sheets.find((s) => s.id === sheetId)
      if (sheet) {
        const fromIndex = sheet.blocks.findIndex((b) => b.id === draggedBlock)
        const toIndex = sheet.blocks.findIndex((b) => b.id === targetBlockId)

        if (fromIndex !== -1 && toIndex !== -1) {
          reorderBlocks(activeWorkbook.id, sheetId, fromIndex, toIndex)
        }
      }
    }
    setDraggedBlock(null)
    setDragOverBlock(null)
  }

  const handleBlockDragEnd = () => {
    setDraggedBlock(null)
    setDragOverBlock(null)
  }

  // Generate JSON Schema
  const generateJsonSchema = () => {
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
        schema.format = field.format
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

  const handleExportSchema = async () => {
    const schema = generateJsonSchema()
    if (!schema) return

    const jsonString = JSON.stringify(schema, null, 2)
    const fileName = `${activeWorkbook?.name || "schema"}.json`

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
      } catch (err: any) {
        // Check if user cancelled the dialog
        if (err.name === "AbortError") {
          // User cancelled, do nothing
          return
        }
        // API failed, fall back to download
        console.error("File System Access API failed:", err)
        downloadFile(jsonString, fileName)
      }
    } else {
      // Fall back to traditional download if File System Access API is not available
      downloadFile(jsonString, fileName)
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

  const exportSchemaFromDialog = async () => {
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
        } catch (err: any) {
          // Check if user cancelled the dialog
          if (err.name === "AbortError") {
            // User cancelled, do nothing
            return
          }
          // API failed, fall back to download
          console.error("File System Access API failed:", err)
          downloadFile(jsonString, fileName)
        }
      } else {
        // Fall back to traditional download if File System Access API is not available
        downloadFile(jsonString, fileName)
      }
    }
  }

  const startEditingSheet = (sheet: any) => {
    setEditingSheet(sheet.id)
    setEditingSheetName(sheet.name)
  }

  const saveSheetName = (workbookId: string, sheetId: string) => {
    if (editingSheetName.trim()) {
      updateSheet(workbookId, sheetId, { name: editingSheetName.trim() })
    }
    setEditingSheet(null)
    setEditingSheetName("")
  }

  const getBlockItemCount = (block: ListBlock | TableBlock) => {
    if (block.type === "list") {
      return (block as ListBlock).items.length
    } else {
      return (block as TableBlock).headers.length
    }
  }

  const startEditingBlock = (block: any) => {
    setEditingBlock(block.id)
    setEditingBlockName(block.name)
  }

  const saveBlockName = (workbookId: string, sheetId: string, blockId: string) => {
    if (editingBlockName.trim()) {
      const currentBlock = activeWorkbook?.sheets.find((s) => s.id === sheetId)?.blocks.find((b) => b.id === blockId)

      if (currentBlock) {
        updateBlock(workbookId, sheetId, { ...currentBlock, name: editingBlockName.trim() })
      }
    }
    setEditingBlock(null)
    setEditingBlockName("")
  }

  const handleEditWorkbookName = () => {
    if (activeWorkbook) {
      setEditingWorkbookName(activeWorkbook.name)
      setIsEditWorkbookDialogOpen(true)
    }
  }

  const saveWorkbookName = () => {
    if (editingWorkbookName.trim() && activeWorkbook) {
      updateWorkbook(activeWorkbook.id, { name: editingWorkbookName.trim() })
    }
    setIsEditWorkbookDialogOpen(false)
    setEditingWorkbookName("")
  }

  const schema = generateJsonSchema()

  return (
    <div className="relative h-full flex-shrink-0" style={{ width: sidebarWidth }}>
      <div className="bg-gray-50 border-r border-gray-200 h-full flex flex-col overflow-hidden">
      {isImportLoading &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
          </div>,
          document.body,
        )}
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 space-y-4">
        {/* Data Model Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold">Workbooks</h2>
          </div>

          {/* Workbook Search / Selector */}
          <WorkbookCombobox
            workbooks={workbooks}
            activeWorkbookId={activeWorkbookId}
            onSelect={(id) => setActiveWorkbook(id)}
          />

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Create Workbook */}
            <Dialog open={isWorkbookDialogOpen} onOpenChange={setIsWorkbookDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-10 h-10 p-0 rounded-full bg-transparent">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workbook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Workbook name"
                    value={newWorkbookName}
                    onChange={(e) => setNewWorkbookName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateWorkbook()}
                  />
                  <Button onClick={handleCreateWorkbook} className="w-full">
                    Create Workbook
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import Schema - Direct Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-10 h-10 p-0 rounded-full bg-transparent">
                  <Download className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import JSON Schema</DialogTitle>
                </DialogHeader>
                <ImportSchemaDialog onClose={() => setIsImportDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            {/* Export Schema - Direct Export */}
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 rounded-full bg-transparent"
              disabled={!activeWorkbook}
              onClick={handleExportSchema}
            >
              <Upload className="w-4 h-4" />
            </Button>

            {/* View Schema - Direct Schema Display */}
            <Dialog open={isSchemaDialogOpen} onOpenChange={setIsSchemaDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-10 h-10 p-0 rounded-full bg-transparent"
                  disabled={!activeWorkbook}
                >
                  <Eye className="w-4 h-4" />
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
                          <Button onClick={exportSchemaFromDialog} size="sm">
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

            {/* Edit Workbook Dialog */}
            <Dialog open={isEditWorkbookDialogOpen} onOpenChange={setIsEditWorkbookDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Workbook Name</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Workbook name"
                    value={editingWorkbookName}
                    onChange={(e) => setEditingWorkbookName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveWorkbookName()}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditWorkbookDialogOpen(false)
                        setEditingWorkbookName("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={saveWorkbookName}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Workbook Confirmation Dialog */}
            <Dialog open={isDeleteWorkbookDialogOpen} onOpenChange={setIsDeleteWorkbookDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Workbook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete the workbook "{activeWorkbook?.name}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDeleteWorkbookDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteWorkbook}>
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Sheet Confirmation Dialog */}
            <Dialog open={isDeleteSheetDialogOpen} onOpenChange={setIsDeleteSheetDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Sheet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete the sheet "{deletingSheet?.sheetName}"? This action cannot be
                    undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteSheetDialogOpen(false)
                        setDeletingSheet(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteSheet}>
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Block Confirmation Dialog */}
            <Dialog open={isDeleteBlockDialogOpen} onOpenChange={setIsDeleteBlockDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete the block "{deletingBlock?.blockName}"? This action cannot be
                    undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteBlockDialogOpen(false)
                        setDeletingBlock(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteBlock}>
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Workbook Name */}
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 rounded-full bg-transparent"
              disabled={!activeWorkbook}
              onClick={handleEditWorkbookName}
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            {/* Delete Workbook */}
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 rounded-full bg-transparent"
              disabled={!activeWorkbook}
              onClick={handleDeleteWorkbook}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sheets Section */}
      {activeWorkbook && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-700">Sheets</h3>
              </div>
              <Dialog open={isSheetDialogOpen} onOpenChange={setIsSheetDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-8 h-8 p-0 rounded-full bg-transparent">
                    <Plus className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Sheet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Sheet name"
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateSheet()}
                    />
                    <Button onClick={handleCreateSheet} className="w-full">
                      Create Sheet
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {activeWorkbook.sheets.map((sheet) => (
                <div key={sheet.id} className="space-y-1">
                  <div
                    draggable
                    onDragStart={(e) => handleSheetDragStart(e, sheet.id)}
                    onDragOver={(e) => handleSheetDragOver(e, sheet.id)}
                    onDragLeave={handleSheetDragLeave}
                    onDrop={(e) => handleSheetDrop(e, sheet.id)}
                    onDragEnd={handleSheetDragEnd}
                    className={cn(
                      "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors",
                      activeSheetId === sheet.id && "bg-blue-100",
                      draggedSheet === sheet.id && "opacity-50",
                      dragOverSheet === sheet.id && "bg-blue-50 border-2 border-blue-300 border-dashed",
                    )}
                    onClick={() => {
                      if (editingSheet !== sheet.id) {
                        setActiveSheet(sheet.id)
                        toggleSheet(sheet.id)
                      }
                    }}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <GripVertical className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing" />
                      {expandedSheets.has(sheet.id) ? (
                        <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0" />
                      )}
                      <Table className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">{sheet.name}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-6 h-6 p-0 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingSheet(sheet)
                          }}
                        >
                          <Edit2 className="w-3 h-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            copySheet(activeWorkbook.id, sheet.id)
                          }}
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSheet(activeWorkbook.id, sheet.id, sheet.name)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Edit Sheet Dialog */}
                  <Dialog
                    open={editingSheet === sheet.id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditingSheet(null)
                        setEditingSheetName("")
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Sheet Name</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Sheet name"
                          value={editingSheetName}
                          onChange={(e) => setEditingSheetName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveSheetName(activeWorkbook.id, sheet.id)}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingSheet(null)
                              setEditingSheetName("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => saveSheetName(activeWorkbook.id, sheet.id)}>Save</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Show blocks when sheet is expanded */}
                  {expandedSheets.has(sheet.id) && (
                    <div className="ml-6 space-y-1">
                      {sheet.blocks.map((block) => (
                        <div
                          key={block.id}
                          draggable
                          onDragStart={(e) => handleBlockDragStart(e, block.id)}
                          onDragOver={(e) => handleBlockDragOver(e, block.id)}
                          onDragLeave={handleBlockDragLeave}
                          onDrop={(e) => handleBlockDrop(e, block.id, sheet.id)}
                          onDragEnd={handleBlockDragEnd}
                          className={cn(
                            "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors",
                            activeBlockId === block.id && "bg-blue-50 border border-blue-200",
                            draggedBlock === block.id && "opacity-50",
                            dragOverBlock === block.id && "bg-blue-50 border-2 border-blue-300 border-dashed",
                          )}
                          onClick={() => {
                            setActiveSheet(sheet.id)
                            setActiveBlock(block.id)
                          }}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <GripVertical className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing" />
                            {block.type === "list" ? (
                              <List className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                            ) : (
                              <Table className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                            )}
                            <span className="text-sm text-gray-700 truncate mr-2">{block.name}</span>
                            <Badge variant="secondary" className="text-xs flex-shrink-0 whitespace-nowrap">
                              {getBlockItemCount(block)} {block.type === "list" ? "fields" : "cols"}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-6 h-6 p-0 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditingBlock(block)
                                }}
                              >
                                <Edit2 className="w-3 h-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyBlock(activeWorkbook.id, sheet.id, block.id)
                                }}
                              >
                                <Copy className="w-3 h-3 mr-2" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteBlock(activeWorkbook.id, sheet.id, block.id, block.name)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                      {sheet.blocks.length === 0 && <div className="ml-6 text-xs text-gray-400 py-1">No blocks</div>}
                    </div>
                  )}

                  {/* Edit Block Dialog */}
                  {sheet.blocks.map((block) => (
                    <Dialog
                      key={`edit-${block.id}`}
                      open={editingBlock === block.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingBlock(null)
                          setEditingBlockName("")
                        }
                      }}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Block Name</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Block name"
                            value={editingBlockName}
                            onChange={(e) => setEditingBlockName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveBlockName(activeWorkbook.id, sheet.id, block.id)}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingBlock(null)
                                setEditingBlockName("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={() => saveBlockName(activeWorkbook.id, sheet.id, block.id)}>Save</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              ))}

              {activeWorkbook.sheets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm mb-3">No sheets in this workbook</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 bg-transparent"
                    onClick={() => setIsSheetDialogOpen(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create First Sheet
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Workbook Selected State */}
      {!activeWorkbook && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-3">No workbook selected</p>
            <Button size="sm" variant="outline" onClick={() => setIsWorkbookDialogOpen(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Create Workbook
            </Button>
          </div>
        </div>
      )}
      </div>

      {/* Resize Handle */}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={resetWidth}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        className={cn(
          "absolute top-0 right-0 z-10 h-full w-1 -translate-x-1/2 cursor-col-resize touch-none select-none",
          "hover:bg-blue-400/60",
          isResizing && "bg-blue-500/70",
        )}
      />
    </div>
  )
}
