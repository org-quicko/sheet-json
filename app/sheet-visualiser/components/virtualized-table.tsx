"use client"

import type React from "react"

import { useRef, useEffect, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { SheetSchema, ValidationError, ColumnWidth } from "../types"
import { getCellValidationError } from "../utils/validation"
import { getBlockSchema } from "../utils/schema"

interface VirtualizedTableProps {
  currentBlock: any
  workbookSchema: SheetSchema | null
  currentSheetName: string
  currentBlockName: string
  validationErrors: ValidationError[]
  selectedCell: { row: number; col: number } | null
  editingCell: { row: number; col: number } | null
  editingValue: string
  columnWidths: ColumnWidth
  isResizing: { col: number; startX: number; startWidth: number } | null
  onCellClick: (row: number, col: number) => void
  onCellDoubleClick: (row: number, col: number, value: any) => void
  onEditingValueChange: (value: string) => void
  onCellEdit: (value: string) => void
  onCancelEdit: () => void
  onColumnResize: (colIndex: number, startX: number, startWidth: number) => void
  onColumnResizeEnd: () => void
  onColumnWidthChange: (widths: ColumnWidth) => void
  onEditListItem?: (index: number) => void
}

const DEFAULT_COLUMN_WIDTH = 250
const MIN_COLUMN_WIDTH = 60
const ROW_HEIGHT = 40
const HEADER_HEIGHT = 48

export function VirtualizedTable({
  currentBlock,
  workbookSchema,
  currentSheetName,
  currentBlockName,
  validationErrors,
  selectedCell,
  editingCell,
  editingValue,
  columnWidths,
  isResizing,
  onCellClick,
  onCellDoubleClick,
  onEditingValueChange,
  onCellEdit,
  onCancelEdit,
  onColumnResize,
  onColumnResizeEnd,
  onColumnWidthChange,
  onEditListItem,
}: VirtualizedTableProps) {
  const tableParentRef = useRef<HTMLDivElement>(null)

  // Helper function to safely convert values to string, handling 0 properly
  const safeStringify = (value: any): string => {
    if (value === undefined) return ""
    if (value === 0) return "0"
    if (value === false) return "false"
    if (value === true) return "true"
    return String(value)
  }

  // For list blocks, we need to handle key-value pairs differently
  const getListData = () => {
    if (currentBlock["@entity"] !== "list" || !currentBlock.items) return { rows: [] }

    const rows = currentBlock.items.flatMap((item: any, itemIndex: number) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        return Object.entries(item).map(([key, value]) => ({ key, value, itemIndex }))
      }
      if (Array.isArray(item)) {
        return item.map((value: any, idx: number) => ({ key: `Item ${idx + 1}`, value, itemIndex }))
      }
      return [{ key: "Value", value: item, itemIndex }]
    })

    return { rows }
  }

  const getTableData = () => {
    if (currentBlock["@entity"] !== "table") return { headers: [], rows: [], maxCols: 0 }

    const headers = currentBlock.header || []
    const rows = currentBlock.rows || []
    const maxCols = headers.length

    return { headers, rows, maxCols }
  }

  const isListBlock = currentBlock["@entity"] === "list"
  const listData = isListBlock ? getListData() : { rows: [] }
  const tableData = !isListBlock ? getTableData() : { headers: [], rows: [], maxCols: 0 }

  const blockSchema = useMemo(() => {
    if (workbookSchema) {
      return getBlockSchema(workbookSchema, currentSheetName, currentBlockName)
    }
    return null
  }, [workbookSchema, currentSheetName, currentBlockName])

  const columnCount = isListBlock ? 2 : tableData.maxCols
  const rowCount = isListBlock ? listData.rows.length : tableData.rows.length

  const columnVirtualizer = useVirtualizer({
    count: columnCount,
    getScrollElement: () => tableParentRef.current,
    estimateSize: (index) => columnWidths[index] || DEFAULT_COLUMN_WIDTH,
    horizontal: true,
  })

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => tableParentRef.current,
    estimateSize: () => ROW_HEIGHT,
  })

  const getColumnWidth = (colIndex: number) => {
    return columnWidths[colIndex] || DEFAULT_COLUMN_WIDTH
  }

  // Handle column resizing
  useEffect(() => {
    if (isResizing) {
      const handleMove = (e: MouseEvent) => {
        e.preventDefault()
        const diff = e.clientX - isResizing.startX
        const newWidth = Math.max(MIN_COLUMN_WIDTH, isResizing.startWidth + diff)
        onColumnWidthChange({
          ...columnWidths,
          [isResizing.col]: newWidth,
        })
        columnVirtualizer.measure()
      }

      const handleUp = () => {
        onColumnResizeEnd()
      }

      document.addEventListener("mousemove", handleMove, { passive: false })
      document.addEventListener("mouseup", handleUp)

      return () => {
        document.removeEventListener("mousemove", handleMove)
        document.removeEventListener("mouseup", handleUp)
      }
    }
  }, [isResizing, columnWidths, onColumnWidthChange, onColumnResizeEnd, columnVirtualizer])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell || !currentBlock) return

    const maxRows = rowCount
    const maxCols = columnCount

    let newRow = selectedCell.row
    let newCol = selectedCell.col

    switch (e.key) {
      case "ArrowUp":
        newRow = Math.max(0, selectedCell.row - 1)
        break
      case "ArrowDown":
        newRow = Math.min(maxRows - 1, selectedCell.row + 1)
        break
      case "ArrowLeft":
        newCol = Math.max(0, selectedCell.col - 1)
        break
      case "ArrowRight":
        newCol = Math.min(maxCols - 1, selectedCell.col + 1)
        break
      case "Enter":
        if (editingCell) {
          onCellEdit(editingValue)
        } else {
          const currentValue = getCurrentCellValue(selectedCell.row, selectedCell.col)
          onCellDoubleClick(selectedCell.row, selectedCell.col, currentValue)
        }
        return
      case "Escape":
        onCancelEdit()
        return
      default:
        return
    }

    onCellClick(newRow, newCol)
    e.preventDefault()
  }

  const getCurrentCellValue = (rowIndex: number, colIndex: number) => {
    if (!currentBlock) return ""

    if (isListBlock) {
      const row = listData.rows[rowIndex]
      if (!row) return ""
      return colIndex === 0 ? row.key : safeStringify(row.value)
    } else {
      const value = tableData.rows[rowIndex]?.[colIndex]
      return safeStringify(value)
    }
  }

  const getFieldSchemaForColumn = (colIndex: number, rowKey?: string) => {
    if (!blockSchema) return null

    if (isListBlock) {
      if (colIndex === 0) return null // Key column doesn't have schema

      // For list blocks, get schema based on the key
      if (blockSchema.properties?.items?.items && "properties" in blockSchema.properties.items.items) {
        const itemProperties = blockSchema.properties.items.items.properties
        return rowKey && itemProperties[rowKey] ? itemProperties[rowKey] : null
      } else {
        // Simple list items
        return blockSchema.properties?.items?.items || null
      }
    } else {
      // For table blocks
      if (blockSchema.properties?.rows?.items?.items && Array.isArray(blockSchema.properties.rows.items.items)) {
        return blockSchema.properties.rows.items.items[colIndex] || null
      }
    }

    return null
  }

  if (!currentBlock) return null

  return (
    <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div
        ref={tableParentRef}
        className="h-full overflow-auto"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ outline: "none" }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize() + HEADER_HEIGHT}px`,
            width: `${columnVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {/* Header Row */}
          <div
            className="sticky top-0 z-20 bg-gray-100 border-b-2 border-gray-300 shadow-sm"
            style={{
              height: HEADER_HEIGHT,
              width: `${columnVirtualizer.getTotalSize()}px`,
            }}
          >
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const colIndex = virtualColumn.index
              let headerText = ""
              let fieldSchema = null

              if (isListBlock) {
                headerText = colIndex === 0 ? "Key" : "Value"
                // For list blocks, we can't show schema in header since it varies by row
              } else {
                headerText = tableData.headers[colIndex] || `Column ${colIndex + 1}`
                fieldSchema = getFieldSchemaForColumn(colIndex)
              }

              return (
                <div
                  key={virtualColumn.key}
                  className="absolute top-0 flex items-center px-3 font-semibold text-sm bg-gray-100 border-r border-gray-300 group"
                  style={{
                    left: `${virtualColumn.start}px`,
                    width: `${virtualColumn.size}px`,
                    height: HEADER_HEIGHT,
                  }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2 truncate flex-1">
                          <span className="truncate font-medium text-gray-800">{headerText}</span>
                          {fieldSchema && !isListBlock && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                              {Array.isArray(fieldSchema.type) ? fieldSchema.type.join(" | ") : fieldSchema.type}
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      {fieldSchema && (
                        <TooltipContent>
                          <div className="space-y-1 text-xs">
                            <div>
                              <strong>Type:</strong>{" "}
                              {Array.isArray(fieldSchema.type) ? fieldSchema.type.join(" | ") : fieldSchema.type}
                            </div>
                            {fieldSchema.nullAllowed && <div>Nullable: Yes</div>}
                            {fieldSchema.minimum !== undefined && <div>Min: {fieldSchema.minimum}</div>}
                            {fieldSchema.maximum !== undefined && <div>Max: {fieldSchema.maximum}</div>}
                            {fieldSchema.minLength !== undefined && <div>Min length: {fieldSchema.minLength}</div>}
                            {fieldSchema.maxLength !== undefined && <div>Max length: {fieldSchema.maxLength}</div>}
                            {fieldSchema.enum && <div>Options: {fieldSchema.enum.join(", ")}</div>}
                            {fieldSchema.description && <div>{fieldSchema.description}</div>}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  {/* Column Resize Handle */}
                  <div
                    className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 group-hover:opacity-100 opacity-0 transition-opacity"
                    style={{ backgroundColor: isResizing?.col === colIndex ? "#3b82f6" : undefined }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onColumnResize(colIndex, e.clientX, getColumnWidth(colIndex))
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Data Rows */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowIndex = virtualRow.index

            return (
              <div
                key={virtualRow.key}
                className="absolute"
                style={{
                  top: `${virtualRow.start + HEADER_HEIGHT}px`,
                  left: 0,
                  height: `${virtualRow.size}px`,
                  width: `${columnVirtualizer.getTotalSize()}px`,
                }}
              >
                {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                  const colIndex = virtualColumn.index
                  let cellValue = ""
                  let fieldSchema = null
                  let rowKey = ""
                  let itemIndex = -1

                  if (isListBlock) {
                    const row = listData.rows[rowIndex]
                    if (row) {
                      cellValue = colIndex === 0 ? row.key : safeStringify(row.value)
                      rowKey = row.key
                      itemIndex = row.itemIndex
                      if (colIndex === 1) {
                        fieldSchema = getFieldSchemaForColumn(colIndex, rowKey)
                      }
                    }
                  } else {
                    const value = tableData.rows[rowIndex]?.[colIndex]
                    cellValue = safeStringify(value)
                    fieldSchema = getFieldSchemaForColumn(colIndex)
                  }

                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex
                  const validationError = getCellValidationError(validationErrors, rowIndex, colIndex)

                  const handleCellClick = () => {
                    onCellClick(rowIndex, colIndex)
                  }

                  const handleCellDoubleClick = () => {
                    onCellDoubleClick(rowIndex, colIndex, cellValue)
                  }

                  return (
                    <div
                      key={virtualColumn.key}
                      className={`absolute top-0 border-r border-b border-gray-200 px-3 py-2 text-sm cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300" : "hover:bg-gray-50"
                      } ${validationError ? "bg-red-50 border-red-200" : ""} ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                      style={{
                        left: `${virtualColumn.start}px`,
                        width: `${virtualColumn.size}px`,
                        height: ROW_HEIGHT,
                      }}
                      onClick={handleCellClick}
                      onDoubleClick={handleCellDoubleClick}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => onEditingValueChange(e.target.value)}
                          onBlur={() => onCellEdit(editingValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onCellEdit(editingValue)
                            } else if (e.key === "Escape") {
                              onCancelEdit()
                            }
                          }}
                          className="w-full h-full border-none outline-none bg-transparent resize-none"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center justify-between h-full">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <span className="truncate">{cellValue}</span>
                                  {fieldSchema && isListBlock && colIndex === 1 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-50 text-green-700 border-green-200 flex-shrink-0"
                                    >
                                      {Array.isArray(fieldSchema.type)
                                        ? fieldSchema.type.join(" | ")
                                        : fieldSchema.type}
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              {fieldSchema && (
                                <TooltipContent>
                                  <div className="space-y-1 text-xs">
                                    <div>
                                      <strong>Type:</strong>{" "}
                                      {Array.isArray(fieldSchema.type)
                                        ? fieldSchema.type.join(" | ")
                                        : fieldSchema.type}
                                    </div>
                                    {fieldSchema.nullAllowed && <div>Nullable: Yes</div>}
                                    {fieldSchema.minimum !== undefined && <div>Min: {fieldSchema.minimum}</div>}
                                    {fieldSchema.maximum !== undefined && <div>Max: {fieldSchema.maximum}</div>}
                                    {fieldSchema.minLength !== undefined && (
                                      <div>Min length: {fieldSchema.minLength}</div>
                                    )}
                                    {fieldSchema.maxLength !== undefined && (
                                      <div>Max length: {fieldSchema.maxLength}</div>
                                    )}
                                    {fieldSchema.pattern && (
                                      <div className="break-words min-w-0 max-w-[25vw]">
                                        Pattern: {fieldSchema.pattern}
                                      </div>
                                    )}
                                    {fieldSchema.enum && (
                                      <div className="break-words min-w-0 max-w-[25vw]">
                                        Options: {fieldSchema.enum.join(", ")}
                                      </div>
                                    )}
                                    {fieldSchema.description && (
                                      <div className="break-words min-w-0 max-w-[25vw]">{fieldSchema.description}</div>
                                    )}
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {validationError && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{validationError.message}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
