"use client"

import type React from "react"

import { useState } from "react"
import { Plus, List, Table, Edit2, Trash2, Copy, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSchemaStore } from "@/store/schema-store"
import { ListBlockComponent } from "./list-block"
import { TableBlockComponent } from "./table-block"
import { Badge } from "@/components/ui/badge"
import type { ListBlock, TableBlock, KeyValuePair, TableHeader } from "@/types/schema"

export function MainContent() {
  const {
    workbooks,
    activeWorkbookId,
    activeSheetId,
    activeBlockId,
    createBlock,
    updateBlock,
    deleteBlock,
    copyBlock,
    setActiveSheet,
    setActiveBlock,
    reorderBlocks,
  } = useSchemaStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [blockName, setBlockName] = useState("")
  const [blockType, setBlockType] = useState<"list" | "table">("table")
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [editingBlockName, setEditingBlockName] = useState("")

  // Drag and drop state for list view
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null)

  const activeWorkbook = workbooks.find((wb) => wb.id === activeWorkbookId)
  const activeSheet = activeWorkbook?.sheets.find((sheet) => sheet.id === activeSheetId)
  const activeBlock = activeSheet?.blocks.find((block) => block.id === activeBlockId)

  const handleCreateBlock = () => {
    if (!blockName.trim() || !activeWorkbook || !activeSheet) return

    const baseBlock = {
      id: Date.now().toString(),
      name: blockName.trim(),
    }

    let newBlock
    if (blockType === "list") {
      newBlock = {
        ...baseBlock,
        type: "list" as const,
        items: [],
      }
    } else {
      newBlock = {
        ...baseBlock,
        type: "table" as const,
        headers: [],
        rows: [],
      }
    }

    createBlock(activeWorkbook.id, activeSheet.id, newBlock)
    setBlockName("")
    setIsDialogOpen(false)
  }

  const handleUpdateBlock = (block: ListBlock | TableBlock) => {
    if (!activeWorkbook || !activeSheet) return
    updateBlock(activeWorkbook.id, activeSheet.id, block)
  }

  const handleDeleteBlock = (blockId: string) => {
    if (!activeWorkbook || !activeSheet) return
    deleteBlock(activeWorkbook.id, activeSheet.id, blockId)
  }

  const saveBlockName = (blockId: string, sheetId: string) => {
    if (!editingBlockName.trim() || !activeWorkbook) return

    const sheet = activeWorkbook.sheets.find((s) => s.id === sheetId)
    const currentBlock = sheet?.blocks.find((b) => b.id === blockId)

    if (currentBlock) {
      updateBlock(activeWorkbook.id, sheetId, { ...currentBlock, name: editingBlockName.trim() })
    }
    setEditingBlock(null)
    setEditingBlockName("")
  }

  // Drag and drop handlers for list view
  const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleBlockDragOver = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverBlock(targetBlockId)
  }

  const handleBlockDragLeave = () => {
    setDragOverBlock(null)
  }

  const handleBlockDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault()
    if (draggedBlock && draggedBlock !== targetBlockId && activeWorkbook && activeSheet) {
      const fromIndex = activeSheet.blocks.findIndex((b) => b.id === draggedBlock)
      const toIndex = activeSheet.blocks.findIndex((b) => b.id === targetBlockId)

      if (fromIndex !== -1 && toIndex !== -1) {
        reorderBlocks(activeWorkbook.id, activeSheet.id, fromIndex, toIndex)
      }
    }
    setDraggedBlock(null)
    setDragOverBlock(null)
  }

  const handleBlockDragEnd = () => {
    setDraggedBlock(null)
    setDragOverBlock(null)
  }

  // Add field to current list block
  const handleAddField = () => {
    if (!activeBlock || activeBlock.type !== "list" || !activeWorkbook || !activeSheet) return

    const listBlock = activeBlock as ListBlock
    const newItem: KeyValuePair = {
      id: Date.now().toString(),
      key: "",
      value: "",
      type: "string",
      nullAllowed: false,
    }

    const updatedBlock: ListBlock = {
      ...listBlock,
      items: [...listBlock.items, newItem],
    }

    updateBlock(activeWorkbook.id, activeSheet.id, updatedBlock)
  }

  // Add column to current table block
  const handleAddColumn = () => {
    if (!activeBlock || activeBlock.type !== "table" || !activeWorkbook || !activeSheet) return

    const tableBlock = activeBlock as TableBlock
    const newHeader: TableHeader = {
      id: Date.now().toString(),
      name: "",
      type: "string",
      nullAllowed: false,
    }

    const updatedBlock: TableBlock = {
      ...tableBlock,
      headers: [...tableBlock.headers, newHeader],
    }

    updateBlock(activeWorkbook.id, activeSheet.id, updatedBlock)
  }

  // No workbook selected
  if (!activeWorkbook) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workbook to Begin</h3>
            <p className="text-gray-500">Pick a workbook from the sidebar to view sheets, create blocks, and design your schema.</p>
          </div>
        </div>
      </div>
    )
  }

  // No sheet selected - show all blocks from all sheets
  if (!activeSheet) {
    // Check if workbook has no sheets at all
    if (activeWorkbook.sheets.length === 0) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sheets yet</h3>
              <p className="text-gray-500">Create your first sheet to start building your schema</p>
            </div>
          </div>
        </div>
      )
    }

    const allBlocks = activeWorkbook.sheets.flatMap((sheet) =>
      sheet.blocks.map((block) => ({ ...block, sheetName: sheet.name, sheetId: sheet.id })),
    )

    return (
      <div className="h-full flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">{activeWorkbook.name}</h1>
            <p className="text-gray-500">All Blocks ({allBlocks.length})</p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Block name"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateBlock()}
                  />
                  <Select value={blockType} onValueChange={(value: "list" | "table") => setBlockType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">
                        <div className="flex items-center">
                          <Table className="w-4 h-4 mr-2" />
                          Table (Rows & Headers)
                        </div>
                      </SelectItem>
                      <SelectItem value="list">
                        <div className="flex items-center">
                          <List className="w-4 h-4 mr-2" />
                          List (Key-Value Pairs)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateBlock} className="w-full">
                    Create Block
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {allBlocks.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks yet</h3>
              <p className="text-gray-500 mb-4">Add your first block to start building your schema</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Block
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-3">
              {allBlocks.map((block) => (
                <div
                  key={block.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => {
                    setActiveSheet(block.sheetId)
                    setActiveBlock(block.id)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {block.type === "list" ? (
                        <List className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Table className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{block.name}</h3>
                        <p className="text-sm text-gray-500">Sheet: {block.sheetName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {block.type === "list" ? "List" : "Table"}
                      </Badge>
                      <span className="text-xs text-gray-400 min-w-0">
                        {getBlockItemCount(block)} {block.type === "list" ? "fields" : "columns"}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingBlock(block.id)
                            setEditingBlockName(block.name)
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyBlock(activeWorkbook.id, block.sheetId, block.id)
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBlock(block.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Block Dialog for All Blocks View */}
          {allBlocks.map((block) => (
            <Dialog
              key={`edit-all-${block.id}`}
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
                    onKeyDown={(e) => e.key === "Enter" && saveBlockName(block.id, block.sheetId)}
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
                    <Button onClick={() => saveBlockName(block.id, block.sheetId)}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    )
  }

  // Sheet selected but no block selected - show blocks in this sheet
  if (!activeBlock) {
    return (
      <div className="h-full flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">{activeSheet.name}</h1>
            <p className="text-gray-500">
              Workbook: {activeWorkbook.name} • {activeSheet.blocks.length} blocks
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Block name"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateBlock()}
                  />
                  <Select value={blockType} onValueChange={(value: "list" | "table") => setBlockType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">
                        <div className="flex items-center">
                          <Table className="w-4 h-4 mr-2" />
                          Table (Rows & Headers)
                        </div>
                      </SelectItem>
                      <SelectItem value="list">
                        <div className="flex items-center">
                          <List className="w-4 h-4 mr-2" />
                          List (Key-Value Pairs)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateBlock} className="w-full">
                    Create Block
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSheet.blocks.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks yet</h3>
              <p className="text-gray-500 mb-4">Add your first block to start building your schema</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Block
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSheet.blocks.map((block) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleBlockDragStart(e, block.id)}
                  onDragOver={(e) => handleBlockDragOver(e, block.id)}
                  onDragLeave={handleBlockDragLeave}
                  onDrop={(e) => handleBlockDrop(e, block.id)}
                  onDragEnd={handleBlockDragEnd}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white ${
                    draggedBlock === block.id ? "opacity-50 scale-95" : ""
                  } ${
                    dragOverBlock === block.id && draggedBlock !== block.id
                      ? "border-2 border-dashed border-blue-400 bg-blue-50"
                      : ""
                  }`}
                  onClick={() => setActiveBlock(block.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                      {block.type === "list" ? (
                        <List className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Table className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{block.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {block.type === "list" ? "List" : "Table"}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {getBlockItemCount(block)} {block.type === "list" ? "fields" : "columns"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingBlock(block.id)
                          setEditingBlockName(block.name)
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyBlock(activeWorkbook.id, activeSheet.id, block.id)
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteBlock(block.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Block Dialog for Sheet View */}
          {activeSheet.blocks.map((block) => (
            <Dialog
              key={`edit-sheet-${block.id}`}
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
                    onKeyDown={(e) => e.key === "Enter" && saveBlockName(block.id, activeSheet.id)}
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
                    <Button onClick={() => saveBlockName(block.id, activeSheet.id)}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    )
  }

  // Block selected - show only the selected block
  return (
    <div className="h-full flex flex-col">
      {/* Simple Header */}
      <div className="flex-shrink-0 bg-white border-b">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              {activeBlock.type === "list" ? <List className="w-6 h-6" /> : <Table className="w-6 h-6" />}
              <span>{activeBlock.name}</span>
              <span className="text-lg text-gray-500 capitalize font-normal">({activeBlock.type})</span>
            </h1>
            <p className="text-gray-500">
              Sheet: {activeSheet.name} • Workbook: {activeWorkbook.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Add Field/Column to current block */}
            <Button onClick={activeBlock.type === "list" ? handleAddField : handleAddColumn}>
              <Plus className="w-4 h-4 mr-2" />
              {activeBlock.type === "list" ? "Add Field" : "Add Column"}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content - Only the selected block */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeBlock.type === "list" ? (
            <ListBlockComponent
              block={activeBlock as ListBlock}
              onUpdate={handleUpdateBlock}
              onDelete={() => handleDeleteBlock(activeBlock.id)}
            />
          ) : (
            <TableBlockComponent
              block={activeBlock as TableBlock}
              onUpdate={handleUpdateBlock}
              onDelete={() => handleDeleteBlock(activeBlock.id)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Add helper function for getting block item count
const getBlockItemCount = (block: ListBlock | TableBlock) => {
  if (block.type === "list") {
    return (block as ListBlock).items.length
  } else {
    return (block as TableBlock).headers.length
  }
}
