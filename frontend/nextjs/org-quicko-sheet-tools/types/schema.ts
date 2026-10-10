export interface KeyValuePair {
  id: string
  key: string
  value: string
  type: "string" | "number" | "integer" | "boolean" | "object" | "array"
  format?: "Long" | "BigDecimal"
  description?: string
  examples?: string[]
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  enum?: string[]
  nullAllowed?: boolean
}

export interface TableHeader {
  id: string
  name: string
  type: "string" | "number" | "integer" | "boolean" | "object" | "array"
  format?: "Long" | "BigDecimal"
  description?: string
  examples?: string[]
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  enum?: string[]
  nullAllowed?: boolean
}

export interface TableRow {
  id: string
  cells: Record<string, any>
}

export interface ListBlock {
  id: string
  type: "list"
  name: string
  items: KeyValuePair[]
  description?: string
}

export interface TableBlock {
  id: string
  type: "table"
  name: string
  headers: TableHeader[]
  rows: TableRow[]
  description?: string
}

export type Block = ListBlock | TableBlock

export interface Sheet {
  id: string
  name: string
  blocks: Block[]
  description?: string
}

export interface Workbook {
  id: string
  name: string
  sheets: Sheet[]
  description?: string
}

export interface SchemaBuilderState {
  workbooks: Workbook[]
  activeWorkbookId: string | null
  activeSheetId: string | null
}
