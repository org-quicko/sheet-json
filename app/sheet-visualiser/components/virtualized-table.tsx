"use client"

import type React from "react"

import { useRef, useEffect, useMemo, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AlertCircle, ArrowUp, ArrowDown, ArrowUpDown, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

  const [sortConfig, setSortConfig] = useState<{ col: number; direction: "asc" | "desc" } | null>(null)
  const [columnFilters, setColumnFilters] = useState<Record<number, Set<string>>>({})
  const [filterDraft, setFilterDraft] = useState<{ col: number; search: string; selected: Set<string> } | null>(
    null,
  )
  const [openFilterCol, setOpenFilterCol] = useState<number | null>(null)

  // Reset sort/filter state whenever the active sheet or block changes
  useEffect(() => {
    setSortConfig(null)
    setColumnFilters({})
    setFilterDraft(null)
    setOpenFilterCol(null)
  }, [currentSheetName, currentBlockName])

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

  // Unique values per column, used to populate the Excel-style filter dropdown
  const uniqueValuesForColumn = (col: number): string[] => {
    if (isListBlock) return []
    const values = new Set<string>()
    for (const row of tableData.rows) {
      values.add(safeStringify(row?.[col]))
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }

  // Compute the display order of row indices (into the real, unfiltered tableData.rows)
  // after applying active column filters and the active sort.
  const filteredIndices = useMemo(() => {
    if (isListBlock) return []

    let indices = tableData.rows.map((_: any, i: number) => i)

    const activeFilterCols = Object.keys(columnFilters).map(Number)
    if (activeFilterCols.length > 0) {
      indices = indices.filter((rowIndex: number) => {
        const row = tableData.rows[rowIndex]
        return activeFilterCols.every((col) => {
          const allowed = columnFilters[col]
          if (!allowed) return true
          return allowed.has(safeStringify(row?.[col]))
        })
      })
    }

    if (sortConfig) {
      const { col, direction } = sortConfig
      const dir = direction === "asc" ? 1 : -1
      indices = [...indices].sort((a: number, b: number) => {
        const rawA = tableData.rows[a]?.[col]
        const rawB = tableData.rows[b]?.[col]
        const strA = safeStringify(rawA)
        const strB = safeStringify(rawB)

        const aEmpty = strA === ""
        const bEmpty = strB === ""
        if (aEmpty && bEmpty) return 0
        if (aEmpty) return 1
        if (bEmpty) return -1

        const numA = Number(rawA)
        const numB = Number(rawB)
        const bothNumeric = rawA !== "" && rawB !== "" && !Number.isNaN(numA) && !Number.isNaN(numB)

        if (bothNumeric) {
          return (numA - numB) * dir
        }
        return strA.localeCompare(strB) * dir
      })
    }

    return indices
  }, [isListBlock, tableData.rows, columnFilters, sortConfig])

  // Translate a display (visible) row index to the real index into tableData.rows
  const toActualRow = (displayIndex: number) => {
    return isListBlock ? displayIndex : filteredIndices[displayIndex]
  }

  const hasActiveFiltersOrSort = sortConfig !== null || Object.keys(columnFilters).length > 0

  const toggleSort = (col: number) => {
    setSortConfig((prev) => {
      if (!prev || prev.col !== col) return { col, direction: "asc" }
      if (prev.direction === "asc") return { col, direction: "desc" }
      return null
    })
  }

  const openFilterPopover = (col: number) => {
    const allValues = uniqueValuesForColumn(col)
    const existing = columnFilters[col]
    setFilterDraft({
      col,
      search: "",
      selected: existing ? new Set(existing) : new Set(allValues),
    })
    setOpenFilterCol(col)
  }

  const applyFilterDraft = () => {
    if (!filterDraft) return
    const allValues = uniqueValuesForColumn(filterDraft.col)
    setColumnFilters((prev) => {
      const next = { ...prev }
      if (filterDraft.selected.size === allValues.length) {
        // Everything selected == no filter, keep state minimal
        delete next[filterDraft.col]
      } else {
        next[filterDraft.col] = new Set(filterDraft.selected)
      }
      return next
    })
    setOpenFilterCol(null)
    setFilterDraft(null)
  }

  const resetFilterDraft = () => {
    if (!filterDraft) return
    setColumnFilters((prev) => {
      const next = { ...prev }
      delete next[filterDraft.col]
      return next
    })
    setOpenFilterCol(null)
    setFilterDraft(null)
  }

  const clearAllFiltersAndSort = () => {
    setSortConfig(null)
    setColumnFilters({})
  }

  const columnCount = isListBlock ? 2 : tableData.maxCols
  const rowCount = isListBlock ? listData.rows.length : filteredIndices.length

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

    // selectedCell.row is always a real row index. For table blocks with an active
    // filter/sort, translate to the current display order before moving up/down.
    const currentDisplayRow = isListBlock
      ? selectedCell.row
      : Math.max(0, filteredIndices.indexOf(selectedCell.row))

    let newDisplayRow = currentDisplayRow
    let newCol = selectedCell.col

    switch (e.key) {
      case "ArrowUp":
        newDisplayRow = Math.max(0, currentDisplayRow - 1)
        break
      case "ArrowDown":
        newDisplayRow = Math.min(maxRows - 1, currentDisplayRow + 1)
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

    const newRow = isListBlock ? newDisplayRow : toActualRow(newDisplayRow)
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
    <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {!isListBlock && hasActiveFiltersOrSort && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-200 bg-gray-50 text-xs text-gray-600 flex-shrink-0">
          <span>
            Showing {filteredIndices.length} of {tableData.rows.length} rows
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900"
            onClick={clearAllFiltersAndSort}
          >
            <X data-icon="inline-start" />
            Clear all filters
          </Button>
        </div>
      )}
      <div
        ref={tableParentRef}
        className="flex-1 min-h-0 overflow-auto"
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

              const isSortedCol = !isListBlock && sortConfig?.col === colIndex
              const isFilteredCol = !isListBlock && Boolean(columnFilters[colIndex])

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
                  {isListBlock ? (
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="truncate font-medium text-gray-800">{headerText}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-2 truncate flex-1 min-w-0 text-left cursor-pointer"
                      onClick={() => toggleSort(colIndex)}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                              <span className="truncate font-medium text-gray-800">{headerText}</span>
                              {fieldSchema && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                                >
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
                                {fieldSchema.minLength !== undefined && (
                                  <div>Min length: {fieldSchema.minLength}</div>
                                )}
                                {fieldSchema.maxLength !== undefined && (
                                  <div>Max length: {fieldSchema.maxLength}</div>
                                )}
                                {fieldSchema.enum && <div>Options: {fieldSchema.enum.join(", ")}</div>}
                                {fieldSchema.description && <div>{fieldSchema.description}</div>}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {isSortedCol ? (
                        sortConfig?.direction === "asc" ? (
                          <ArrowUp className="size-3.5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <ArrowDown className="size-3.5 text-blue-600 flex-shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      )}
                    </button>
                  )}

                  {!isListBlock && (
                    <Popover
                      open={openFilterCol === colIndex}
                      onOpenChange={(open) => {
                        if (open) {
                          openFilterPopover(colIndex)
                        } else {
                          setOpenFilterCol(null)
                          setFilterDraft(null)
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`ml-1 p-1 rounded flex-shrink-0 hover:bg-gray-200 ${
                            isFilteredCol ? "text-blue-600" : "text-gray-400"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Filter ${headerText}`}
                        >
                          <Filter className={`size-3.5 ${isFilteredCol ? "fill-blue-100" : ""}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-64 p-3">
                        {filterDraft && filterDraft.col === colIndex && (
                          <FilterPopoverContent
                            allValues={uniqueValuesForColumn(colIndex)}
                            draft={filterDraft}
                            onSearchChange={(search) => setFilterDraft({ ...filterDraft, search })}
                            onToggleValue={(value) => {
                              const nextSelected = new Set(filterDraft.selected)
                              if (nextSelected.has(value)) {
                                nextSelected.delete(value)
                              } else {
                                nextSelected.add(value)
                              }
                              setFilterDraft({ ...filterDraft, selected: nextSelected })
                            }}
                            onSelectAll={(allValues) => setFilterDraft({ ...filterDraft, selected: new Set(allValues) })}
                            onClearAll={() => setFilterDraft({ ...filterDraft, selected: new Set() })}
                            onApply={applyFilterDraft}
                            onReset={resetFilterDraft}
                          />
                        )}
                      </PopoverContent>
                    </Popover>
                  )}

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
            const displayIndex = virtualRow.index
            const rowIndex = toActualRow(displayIndex)

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
                        displayIndex % 2 === 0 ? "bg-white" : "bg-gray-25"
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

interface FilterPopoverContentProps {
  allValues: string[]
  draft: { col: number; search: string; selected: Set<string> }
  onSearchChange: (search: string) => void
  onToggleValue: (value: string) => void
  onSelectAll: (allValues: string[]) => void
  onClearAll: () => void
  onApply: () => void
  onReset: () => void
}

function FilterPopoverContent({
  allValues,
  draft,
  onSearchChange,
  onToggleValue,
  onSelectAll,
  onClearAll,
  onApply,
  onReset,
}: FilterPopoverContentProps) {
  const visibleValues = draft.search
    ? allValues.filter((v) => v.toLowerCase().includes(draft.search.toLowerCase()))
    : allValues

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={draft.search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search values..."
        className="h-8 text-sm"
      />
      <div className="flex items-center justify-between text-xs">
        <button type="button" className="text-blue-600 hover:underline" onClick={() => onSelectAll(allValues)}>
          Select all
        </button>
        <button type="button" className="text-blue-600 hover:underline" onClick={onClearAll}>
          Clear
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto flex flex-col gap-1 border border-gray-100 rounded-md p-2">
        {visibleValues.length === 0 && <div className="text-xs text-gray-400 px-1 py-2">No values found</div>}
        {visibleValues.map((value) => {
          const checkboxId = `filter-value-${value}`
          return (
            <label
              key={value}
              htmlFor={checkboxId}
              className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                id={checkboxId}
                checked={draft.selected.has(value)}
                onCheckedChange={() => onToggleValue(value)}
              />
              <span className="truncate">{value === "" ? "(Blank)" : value}</span>
            </label>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onReset}>
          Reset
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  )
}
