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
  deleteWorkbook: (workbookId: string) => void
  updateWorkbook: (workbookId: string, updates: Partial<Workbook>) => void
  setActiveWorkbook: (workbookId: string) => void

  // Sheet actions
  createSheet: (workbookId: string, name: string) => void
  deleteSheet: (workbookId: string, sheetId: string) => void
  updateSheet: (workbookId: string, sheetId: string, updates: Partial<Sheet>) => void
  setActiveSheet: (sheetId: string) => void
  copySheet: (workbookId: string, sheetId: string) => void
  reorderSheets: (workbookId: string, fromIndex: number, toIndex: number) => void

  // Block actions
  createBlock: (workbookId: string, sheetId: string, block: Block) => void
  updateBlock: (workbookId: string, sheetId: string, block: Block) => void
  deleteBlock: (workbookId: string, sheetId: string, blockId: string) => void
  setActiveBlock: (blockId: string) => void
  copyBlock: (workbookId: string, sheetId: string, blockId: string) => void
  reorderBlocks: (workbookId: string, sheetId: string, fromIndex: number, toIndex: number) => void

  // Import/Export
  importWorkbook: (workbook: Workbook) => void
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

      deleteWorkbook: (workbookId: string) => {
        set((state) => ({
          workbooks: state.workbooks.filter((wb) => wb.id !== workbookId),
          activeWorkbookId: state.activeWorkbookId === workbookId ? null : state.activeWorkbookId,
          activeSheetId: state.activeWorkbookId === workbookId ? null : state.activeSheetId,
          activeBlockId: state.activeWorkbookId === workbookId ? null : state.activeBlockId,
        }))
      },

      updateWorkbook: (workbookId: string, updates: Partial<Workbook>) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) => (wb.id === workbookId ? { ...wb, ...updates } : wb)),
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

      setActiveSheet: (sheetId: string) => {
        set({ activeSheetId: sheetId, activeBlockId: null })
      },

      copySheet: (workbookId: string, sheetId: string) => {
        const state = get()
        const workbook = state.workbooks.find((wb) => wb.id === workbookId)
        const sheet = workbook?.sheets.find((s) => s.id === sheetId)

        if (sheet) {
          const copiedSheet: Sheet = {
            ...sheet,
            id: Date.now().toString(),
            name: `${sheet.name} (Copy)`,
            blocks: sheet.blocks.map((block) => ({
              ...block,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            })),
          }

          set((state) => ({
            workbooks: state.workbooks.map((wb) =>
              wb.id === workbookId ? { ...wb, sheets: [...wb.sheets, copiedSheet] } : wb,
            ),
          }))
        }
      },

      reorderSheets: (workbookId: string, fromIndex: number, toIndex: number) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) => {
            if (wb.id === workbookId) {
              const newSheets = [...wb.sheets]
              const [movedSheet] = newSheets.splice(fromIndex, 1)
              newSheets.splice(toIndex, 0, movedSheet)
              return { ...wb, sheets: newSheets }
            }
            return wb
          }),
        }))
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
                      ? {
                          ...sheet,
                          blocks: sheet.blocks.filter((block) => block.id !== blockId),
                        }
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

      copyBlock: (workbookId: string, sheetId: string, blockId: string) => {
        const state = get()
        const workbook = state.workbooks.find((wb) => wb.id === workbookId)
        const sheet = workbook?.sheets.find((s) => s.id === sheetId)
        const block = sheet?.blocks.find((b) => b.id === blockId)

        if (block) {
          const copiedBlock: Block = {
            ...block,
            id: Date.now().toString(),
            name: `${block.name} (Copy)`,
          }

          set((state) => ({
            workbooks: state.workbooks.map((wb) =>
              wb.id === workbookId
                ? {
                    ...wb,
                    sheets: wb.sheets.map((sheet) =>
                      sheet.id === sheetId ? { ...sheet, blocks: [...sheet.blocks, copiedBlock] } : sheet,
                    ),
                  }
                : wb,
            ),
          }))
        }
      },

      reorderBlocks: (workbookId: string, sheetId: string, fromIndex: number, toIndex: number) => {
        set((state) => ({
          workbooks: state.workbooks.map((wb) => {
            if (wb.id === workbookId) {
              return {
                ...wb,
                sheets: wb.sheets.map((sheet) => {
                  if (sheet.id === sheetId) {
                    const newBlocks = [...sheet.blocks]
                    const [movedBlock] = newBlocks.splice(fromIndex, 1)
                    newBlocks.splice(toIndex, 0, movedBlock)
                    return { ...sheet, blocks: newBlocks }
                  }
                  return sheet
                }),
              }
            }
            return wb
          }),
        }))
      },

      importWorkbook: (workbook: Workbook) => {
        set((state) => ({
          workbooks: [...state.workbooks, workbook],
          activeWorkbookId: workbook.id,
        }))
      },
    }),
    {
      name: "schema-store",
    },
  ),
)
