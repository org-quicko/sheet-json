"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WorkbookData, SheetSchema, ValidationError, ColumnWidth } from "../types"
import { VirtualizedTable } from "./virtualized-table"
import { AddDataDialog } from "./add-data-dialog"

interface SheetTabsProps {
  workbookData: WorkbookData
  workbookSchema: SheetSchema | null
  activeSheetIndex: number
  activeBlockIndex: number
  validationErrors: ValidationError[]
  selectedCell: { row: number; col: number } | null
  editingCell: { row: number; col: number } | null
  editingValue: string
  columnWidths: ColumnWidth
  isResizing: { col: number; startX: number; startWidth: number } | null
  isSheetSwitching: boolean
  isBlockSwitching: boolean
  onSheetChange: (index: number) => void
  onBlockChange: (index: number) => void
  onCellClick: (row: number, col: number) => void
  onCellDoubleClick: (row: number, col: number, value: any) => void
  onEditingValueChange: (value: string) => void
  onCellEdit: (value: string) => void
  onCancelEdit: () => void
  onColumnResize: (colIndex: number, startX: number, startWidth: number) => void
  onColumnResizeEnd: () => void
  onColumnWidthChange: (widths: ColumnWidth) => void
  onAddData: (data: any) => void
}

export function SheetTabs({
  workbookData,
  workbookSchema,
  activeSheetIndex,
  activeBlockIndex,
  validationErrors,
  selectedCell,
  editingCell,
  editingValue,
  columnWidths,
  isResizing,
  isSheetSwitching,
  isBlockSwitching,
  onSheetChange,
  onBlockChange,
  onCellClick,
  onCellDoubleClick,
  onEditingValueChange,
  onCellEdit,
  onCancelEdit,
  onColumnResize,
  onColumnResizeEnd,
  onColumnWidthChange,
  onAddData,
}: SheetTabsProps) {
  const currentSheet = workbookData.sheets[activeSheetIndex]
  const currentBlock = currentSheet?.blocks[activeBlockIndex]

  // Get current sheet and block names for validation
  const currentSheetName = currentSheet?.name || ""
  const currentBlockName = currentBlock?.name || ""

  // Filter validation errors for current block
  const blockValidationErrors = useMemo(() => {
    return validationErrors.filter(
      (error) => error.sheetName === currentSheetName && error.blockName === currentBlockName,
    )
  }, [validationErrors, currentSheetName, currentBlockName])

  if (isSheetSwitching) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sheet Tabs */}
      <Tabs value={activeSheetIndex.toString()} onValueChange={(value) => onSheetChange(Number.parseInt(value))}>
        <TabsList className="grid w-full grid-cols-auto">
          {workbookData.sheets.map((sheet, index) => (
            <TabsTrigger key={index} value={index.toString()} className="flex items-center space-x-2">
              <span>{sheet.name}</span>
              {sheet.blocks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {sheet.blocks.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {workbookData.sheets.map((sheet, sheetIndex) => (
          <TabsContent key={sheetIndex} value={sheetIndex.toString()}>
            {sheetIndex === activeSheetIndex && (
              <div className="space-y-4">
                {/* Block Tabs */}
                {sheet.blocks.length > 0 && (
                  <div className="flex items-center justify-between">
                    <Tabs
                      value={activeBlockIndex.toString()}
                      onValueChange={(value) => onBlockChange(Number.parseInt(value))}
                    >
                      <TabsList>
                        {sheet.blocks.map((block, blockIndex) => (
                          <TabsTrigger key={blockIndex} value={blockIndex.toString()}>
                            {block.name} ({block["@entity"]})
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    <div className="flex items-center space-x-2">
                      <AddDataDialog
                        currentBlock={currentBlock}
                        currentSheetName={currentSheetName}
                        workbookSchema={workbookSchema}
                        onAddData={onAddData}
                      />
                    </div>
                  </div>
                )}

                {/* Block Content */}
                {currentBlock && !isBlockSwitching ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>
                          {currentBlock.name} ({currentBlock["@entity"]})
                        </span>
                        {blockValidationErrors.length > 0 && (
                          <Badge variant="destructive">
                            {blockValidationErrors.length} error{blockValidationErrors.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VirtualizedTable
                        currentBlock={currentBlock}
                        workbookSchema={workbookSchema}
                        currentSheetName={currentSheetName}
                        currentBlockName={currentBlockName}
                        validationErrors={blockValidationErrors}
                        selectedCell={selectedCell}
                        editingCell={editingCell}
                        editingValue={editingValue}
                        columnWidths={columnWidths}
                        isResizing={isResizing}
                        onCellClick={onCellClick}
                        onCellDoubleClick={onCellDoubleClick}
                        onEditingValueChange={onEditingValueChange}
                        onCellEdit={onCellEdit}
                        onCancelEdit={onCancelEdit}
                        onColumnResize={onColumnResize}
                        onColumnResizeEnd={onColumnResizeEnd}
                        onColumnWidthChange={onColumnWidthChange}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Skeleton className="h-64 w-full" />
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
