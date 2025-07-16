"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Workbook, Sheet, Block } from "@/types/schema"

interface SchemaStore {
  workbooks: Workbook[]
  activeWorkbookId: string | null
  activeSheetId: string | null
  activeBlockId: string | null

  // Workbook actions
  createWorkbook: (name: string) => void
  updateWorkbook: (workbookId: string, updates: Partial<Workbook>) => void
  deleteWorkbook: (workbookId: string) => void
  setActiveWorkbook: (workbookId: string) => void

  // Sheet actions
  createSheet: (workbookId: string, name: string) => void
  updateSheet: (workbookId: string, sheetId: string, updates: Partial<Sheet>) => void
  deleteSheet: (workbookId: string, sheetId: string) => void
  setActiveSheet: (sheetId: string) => void

  // Block actions
  createBlock: (workbookId: string, sheetId: string, block: Block) => void
  updateBlock: (workbookId: string, sheetId: string, block: Block) => void
  deleteBlock: (workbookId: string, sheetId: string, blockId: string) => void
  setActiveBlock: (blockId: string) => void
}

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      workbooks: [],
      activeWorkbookId: null,
      activeSheetId: null,
      activeBlockId: null,

      createWorkbook: (name: string) => {
        const newWorkbook: Workbook = {
          id: Date.now().toString(),
          name,
          sheets: [],
        }
        set((state) => ({
          workbooks: [...state.workbooks, newWorkbook],
          activeWorkbookId: newWorkbook.id,
        }))
      },

      updateWorkbook: (workbookId: string, updates: Partial<Workbook>) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) => (wb.id === workbookId ? { ...wb, ...updates } : wb)),
        }))
      },

      deleteWorkbook: (workbookId: string) => {
        set((state) => ({
          workbooks: state.workbooks.filter((wb) => wb.id !== workbookId),
          activeWorkbookId: state.activeWorkbookId === workbookId ? null : state.activeWorkbookId,
          activeSheetId: state.activeWorkbookId === workbookId ? null : state.activeSheetId,
          activeBlockId: state.activeWorkbookId === workbookId ? null : state.activeBlockId,
        }))
      },

      setActiveWorkbook: (workbookId: string) => {
        set({ activeWorkbookId: workbookId, activeSheetId: null, activeBlockId: null })
      },

      createSheet: (workbookId: string, name: string) => {
        const newSheet: Sheet = {
          id: Date.now().toString(),
          name,
          blocks: [],
        }
        set((state) => ({
          workbooks: state.workbooks.map((wb) =>
            wb.id === workbookId ? { ...wb, sheets: [...wb.sheets, newSheet] } : wb,
          ),
          activeSheetId: newSheet.id,
          activeBlockId: null,
        }))
      },

      updateSheet: (workbookId: string, sheetId: string, updates: Partial<Sheet>) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) =>
            wb.id === workbookId
              ? {
                  ...wb,
                  sheets: wb.sheets.map((sheet) => (sheet.id === sheetId ? { ...sheet, ...updates } : sheet)),
                }
              : wb,
          ),
        }))
      },

      deleteSheet: (workbookId: string, sheetId: string) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) =>
            wb.id === workbookId ? { ...wb, sheets: wb.sheets.filter((sheet) => sheet.id !== sheetId) } : wb,
          ),
          activeSheetId: state.activeSheetId === sheetId ? null : state.activeSheetId,
          activeBlockId: state.activeSheetId === sheetId ? null : state.activeBlockId,
        }))
      },

      setActiveSheet: (sheetId: string) => {
        set({ activeSheetId: sheetId, activeBlockId: null })
      },

      createBlock: (workbookId: string, sheetId: string, block: Block) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) =>
            wb.id === workbookId
              ? {
                  ...wb,
                  sheets: wb.sheets.map((sheet) =>
                    sheet.id === sheetId ? { ...sheet, blocks: [...sheet.blocks, block] } : sheet,
                  ),
                }
              : wb,
          ),
          activeBlockId: block.id,
        }))
      },

      updateBlock: (workbookId: string, sheetId: string, block: Block) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) =>
            wb.id === workbookId
              ? {
                  ...wb,
                  sheets: wb.sheets.map((sheet) =>
                    sheet.id === sheetId
                      ? {
                          ...sheet,
                          blocks: sheet.blocks.map((b) => (b.id === block.id ? block : b)),
                        }
                      : sheet,
                  ),
                }
              : wb,
          ),
        }))
      },

      deleteBlock: (workbookId: string, sheetId: string, blockId: string) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) =>
            wb.id === workbookId
              ? {
                  ...wb,
                  sheets: wb.sheets.map((sheet) =>
                    sheet.id === sheetId
                      ? { ...sheet, blocks: sheet.blocks.filter((block) => block.id !== blockId) }
                      : sheet,
                  ),
                }
              : wb,
          ),
          activeBlockId: state.activeBlockId === blockId ? null : state.activeBlockId,
        }))
      },

      setActiveBlock: (blockId: string) => {
        set({ activeBlockId: blockId })
      },
    }),
    {
      name: "sheet-schema-builder-storage",
    },
  ),
)
