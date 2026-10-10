import { create } from "zustand"
import type { Workbook, Sheet, Block } from "@/types/schema"
import {
  loadWorkbooksFromStorage,
  loadMetaFromStorage,
  saveWorkbookToStorage,
  removeWorkbookFromStorage,
  saveMetaToStorage,
  migrateLegacyStorageIfNeeded,
} from "@/lib/workbook-storage"

interface SchemaStore {
  workbooks: Workbook[]
  activeWorkbookId: string | null
  activeSheetId: string | null
  activeBlockId: string | null
  isHydrated: boolean

  // Hydration
  hydrate: () => Promise<void>

  // Workbook actions
  createWorkbook: (name: string) => void
  deleteWorkbook: (workbookId: string) => void
  deleteWorkbookByName: (name: string) => void
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

// Persists just the workbook identified by `workbookId` (a single IndexedDB
// record write) rather than the whole store blob.
function persistWorkbook(workbookId: string, previousName?: string) {
  const workbook = useSchemaStore.getState().workbooks.find((wb) => wb.id === workbookId)
  if (workbook) {
    void saveWorkbookToStorage(workbook, previousName)
  }
}

function persistMeta() {
  const { activeWorkbookId, activeSheetId, activeBlockId } = useSchemaStore.getState()
  void saveMetaToStorage({ activeWorkbookId, activeSheetId, activeBlockId })
}

export const useSchemaStore = create<SchemaStore>()((set, get) => ({
  workbooks: [],
  activeWorkbookId: null,
  activeSheetId: null,
  activeBlockId: null,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return
    await migrateLegacyStorageIfNeeded()
    const [workbooks, meta] = await Promise.all([loadWorkbooksFromStorage(), loadMetaFromStorage()])
    set({
      workbooks,
      activeWorkbookId: meta.activeWorkbookId,
      activeSheetId: meta.activeSheetId,
      activeBlockId: meta.activeBlockId,
      isHydrated: true,
    })
  },

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
    persistWorkbook(newWorkbook.id)
    persistMeta()
  },

  deleteWorkbook: (workbookId: string) => {
    const workbook = get().workbooks.find((wb) => wb.id === workbookId)
    set((state) => ({
      workbooks: state.workbooks.filter((wb) => wb.id !== workbookId),
      activeWorkbookId: state.activeWorkbookId === workbookId ? null : state.activeWorkbookId,
      activeSheetId: state.activeWorkbookId === workbookId ? null : state.activeSheetId,
      activeBlockId: state.activeWorkbookId === workbookId ? null : state.activeBlockId,
    }))
    if (workbook) {
      void removeWorkbookFromStorage(workbook.name)
    }
    persistMeta()
  },

  deleteWorkbookByName: (name: string) => {
    set((state) => {
      const workbook = state.workbooks.find((wb) => wb.name === name)
      const isActive = workbook && state.activeWorkbookId === workbook.id
      return {
        workbooks: state.workbooks.filter((wb) => wb.name !== name),
        activeWorkbookId: isActive ? null : state.activeWorkbookId,
        activeSheetId: isActive ? null : state.activeSheetId,
        activeBlockId: isActive ? null : state.activeBlockId,
      }
    })
    void removeWorkbookFromStorage(name)
    persistMeta()
  },

  updateWorkbook: (workbookId: string, updates: Partial<Workbook>) => {
    const previousName = get().workbooks.find((wb) => wb.id === workbookId)?.name
    set((state) => ({
      workbooks: state.workbooks.map((wb) => (wb.id === workbookId ? { ...wb, ...updates } : wb)),
    }))
    persistWorkbook(workbookId, previousName)
  },

  setActiveWorkbook: (workbookId: string) => {
    set({ activeWorkbookId: workbookId, activeSheetId: null, activeBlockId: null })
    persistMeta()
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
    persistWorkbook(workbookId)
    persistMeta()
  },

  deleteSheet: (workbookId: string, sheetId: string) => {
    set((state) => ({
      workbooks: state.workbooks.map((wb) =>
        wb.id === workbookId ? { ...wb, sheets: wb.sheets.filter((sheet) => sheet.id !== sheetId) } : wb,
      ),
      activeSheetId: state.activeSheetId === sheetId ? null : state.activeSheetId,
      activeBlockId: state.activeSheetId === sheetId ? null : state.activeBlockId,
    }))
    persistWorkbook(workbookId)
    persistMeta()
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
    persistWorkbook(workbookId)
  },

  setActiveSheet: (sheetId: string) => {
    set({ activeSheetId: sheetId, activeBlockId: null })
    persistMeta()
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
      persistWorkbook(workbookId)
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
    persistWorkbook(workbookId)
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
    persistWorkbook(workbookId)
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
    persistWorkbook(workbookId)
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
    persistWorkbook(workbookId)
    persistMeta()
  },

  setActiveBlock: (blockId: string) => {
    set({ activeBlockId: blockId })
    persistMeta()
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
      persistWorkbook(workbookId)
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
    persistWorkbook(workbookId)
  },

  importWorkbook: (workbook: Workbook) => {
    // Storage is keyed by name, so importing a workbook whose name matches
    // an existing one replaces it in-memory (rather than appending a
    // duplicate) to stay consistent with the single IndexedDB record it maps to.
    set((state) => ({
      workbooks: [...state.workbooks.filter((wb) => wb.name !== workbook.name), workbook],
      activeWorkbookId: workbook.id,
    }))
    persistWorkbook(workbook.id)
    persistMeta()
  },
}))
