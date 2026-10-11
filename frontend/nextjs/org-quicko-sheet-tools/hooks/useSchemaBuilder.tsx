"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { SchemaBuilderState, Workbook, Sheet, Block } from "@/types/schema"

type Action =
  | { type: "CREATE_WORKBOOK"; name: string }
  | { type: "DELETE_WORKBOOK"; workbookId: string }
  | { type: "SET_ACTIVE_WORKBOOK"; workbookId: string }
  | { type: "CREATE_SHEET"; workbookId: string; name: string }
  | { type: "DELETE_SHEET"; workbookId: string; sheetId: string }
  | { type: "SET_ACTIVE_SHEET"; sheetId: string }
  | { type: "CREATE_BLOCK"; workbookId: string; sheetId: string; block: Block }
  | { type: "UPDATE_BLOCK"; workbookId: string; sheetId: string; block: Block }
  | { type: "DELETE_BLOCK"; workbookId: string; sheetId: string; blockId: string }

const initialState: SchemaBuilderState = {
  workbooks: [],
  activeWorkbookId: null,
  activeSheetId: null,
}

function schemaBuilderReducer(state: SchemaBuilderState, action: Action): SchemaBuilderState {
  switch (action.type) {
    case "CREATE_WORKBOOK": {
      const newWorkbook: Workbook = {
        id: Date.now().toString(),
        name: action.name,
        sheets: [],
      }
      return {
        ...state,
        workbooks: [...state.workbooks, newWorkbook],
        activeWorkbookId: newWorkbook.id,
      }
    }

    case "DELETE_WORKBOOK": {
      const filteredWorkbooks = state.workbooks.filter((wb) => wb.id !== action.workbookId)
      return {
        ...state,
        workbooks: filteredWorkbooks,
        activeWorkbookId: state.activeWorkbookId === action.workbookId ? null : state.activeWorkbookId,
        activeSheetId: state.activeWorkbookId === action.workbookId ? null : state.activeSheetId,
      }
    }

    case "SET_ACTIVE_WORKBOOK":
      return {
        ...state,
        activeWorkbookId: action.workbookId,
        activeSheetId: null,
      }

    case "CREATE_SHEET": {
      const newSheet: Sheet = {
        id: Date.now().toString(),
        name: action.name,
        blocks: [],
      }

      return {
        ...state,
        workbooks: state.workbooks.map((wb) =>
          wb.id === action.workbookId ? { ...wb, sheets: [...wb.sheets, newSheet] } : wb,
        ),
        activeSheetId: newSheet.id,
      }
    }

    case "DELETE_SHEET":
      return {
        ...state,
        workbooks: state.workbooks.map((wb) =>
          wb.id === action.workbookId
            ? { ...wb, sheets: wb.sheets.filter((sheet) => sheet.id !== action.sheetId) }
            : wb,
        ),
        activeSheetId: state.activeSheetId === action.sheetId ? null : state.activeSheetId,
      }

    case "SET_ACTIVE_SHEET":
      return {
        ...state,
        activeSheetId: action.sheetId,
      }

    case "CREATE_BLOCK":
      return {
        ...state,
        workbooks: state.workbooks.map((wb) =>
          wb.id === action.workbookId
            ? {
                ...wb,
                sheets: wb.sheets.map((sheet) =>
                  sheet.id === action.sheetId ? { ...sheet, blocks: [...sheet.blocks, action.block] } : sheet,
                ),
              }
            : wb,
        ),
      }

    case "UPDATE_BLOCK":
      return {
        ...state,
        workbooks: state.workbooks.map((wb) =>
          wb.id === action.workbookId
            ? {
                ...wb,
                sheets: wb.sheets.map((sheet) =>
                  sheet.id === action.sheetId
                    ? {
                        ...sheet,
                        blocks: sheet.blocks.map((block) => (block.id === action.block.id ? action.block : block)),
                      }
                    : sheet,
                ),
              }
            : wb,
        ),
      }

    case "DELETE_BLOCK":
      return {
        ...state,
        workbooks: state.workbooks.map((wb) =>
          wb.id === action.workbookId
            ? {
                ...wb,
                sheets: wb.sheets.map((sheet) =>
                  sheet.id === action.sheetId
                    ? { ...sheet, blocks: sheet.blocks.filter((block) => block.id !== action.blockId) }
                    : sheet,
                ),
              }
            : wb,
        ),
      }

    default:
      return state
  }
}

const SchemaBuilderContext = createContext<{
  state: SchemaBuilderState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function SchemaBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(schemaBuilderReducer, initialState)

  return <SchemaBuilderContext.Provider value={{ state, dispatch }}>{children}</SchemaBuilderContext.Provider>
}

export function useSchemaBuilder() {
  const context = useContext(SchemaBuilderContext)
  if (!context) {
    throw new Error("useSchemaBuilder must be used within a SchemaBuilderProvider")
  }
  return context
}
