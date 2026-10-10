export interface WorkbookData {
  name: string
  "@entity": "workbook"
  sheets: SheetData[]
}

export interface SheetData {
  name: string
  "@entity": "sheet"
  blocks: BlockData[]
}

export interface BlockData {
  name: string
  "@entity": "table" | "list"
  header?: string[]
  rows?: any[][]
  items?: any[]
}

export interface SheetSchema {
  type: "object"
  properties: {
    name: {
      type: "string"
      enum: string[]
    }
    "@entity": {
      type: "string"
      enum: ["workbook"]
    }
    sheets: {
      type: "array"
      items: {
        oneOf: SheetSchemaItem[]
      }
    }
  }
  required: string[]
}

export interface SheetSchemaItem {
  type: "object"
  properties: {
    name: {
      type: "string"
      enum: string[]
    }
    "@entity": {
      type: "string"
      enum: ["sheet"]
    }
    blocks: {
      type: "array"
      items: {
        oneOf: BlockSchemaItem[]
      }
    }
  }
  required: string[]
}

export interface BlockSchemaItem {
  type: "object"
  properties: {
    name: {
      type: "string"
      enum: string[]
    }
    "@entity": {
      type: "string"
      enum: ["table" | "list"]
    }
    header?: {
      type: "array"
      items: FieldSchema[]
    }
    rows?: {
      type: "array"
      items: {
        type: "array"
        items: FieldSchema[]
      }
    }
    items?: {
      type: "array"
      items:
        | FieldSchema
        | {
            type: "object"
            properties: Record<string, FieldSchema>
          }
    }
  }
  required: string[]
}

export interface FieldSchema {
  type: string | string[]
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: string[]
  nullAllowed?: boolean
  description?: string
}

export interface ValidationError {
  row: number
  col: number
  message: string
  severity: "error" | "warning"
}

export interface ColumnWidth {
  [key: number]: number
}
