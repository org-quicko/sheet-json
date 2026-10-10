import type { SheetSchema } from "../types"

export function createEmptyWorkbookFromSchema(schema: SheetSchema) {
  const workbookName = schema.properties.name?.enum?.[0] || "New Workbook"

  const sheets = schema.properties.sheets.items.oneOf.map((sheetSchema: any) => {
    const sheetName = sheetSchema.properties.name?.enum?.[0] || "New Sheet"

    const blocks = sheetSchema.properties.blocks.items.oneOf.map((blockSchema: any) => {
      const blockName = blockSchema.properties.name?.enum?.[0] || "New Block"
      const blockType = blockSchema.properties["@entity"].enum[0]

      if (blockType === "table") {
        const headers = blockSchema.properties.header?.items?.map((item: any) => item.enum?.[0] || "Column") || []
        return {
          name: blockName,
          "@entity": "table" as const,
          header: headers,
          rows: [],
        }
      } else {
        return {
          name: blockName,
          "@entity": "list" as const,
          items: [],
        }
      }
    })

    return {
      name: sheetName,
      "@entity": "sheet" as const,
      blocks,
    }
  })

  return {
    name: workbookName,
    "@entity": "workbook" as const,
    sheets,
  }
}

export function validateSchemaStructure(schema: any): boolean {
  if (!schema || typeof schema !== "object") return false
  if (!schema.properties || !schema.properties.sheets) return false
  if (!schema.properties.sheets.items || !schema.properties.sheets.items.oneOf) return false

  return true
}

export function getBlockSchema(schema: SheetSchema, sheetName: string, blockName: string) {
  if (!schema || !validateSchemaStructure(schema)) {
    return null
  }

  const sheets = schema.properties.sheets.items.oneOf
  if (!sheets) {
    return null
  }

  // Find sheet schema by name
  const sheetSchema = sheets.find((s: any) => s.properties.name?.enum?.[0] === sheetName)
  if (!sheetSchema || !sheetSchema.properties || !sheetSchema.properties.blocks) {
    return null
  }

  // Find block schema by name
  const blocks = sheetSchema.properties.blocks.items.oneOf
  if (!blocks) {
    return null
  }

  const blockSchema = blocks.find((b: any) => b.properties.name?.enum?.[0] === blockName)

  return blockSchema || null
}

export function getSheetOrderFromSchema(schema: SheetSchema | null): string[] {
  if (!schema || !validateSchemaStructure(schema)) {
    return []
  }

  return schema.properties.sheets.items.oneOf.map((sheetSchema: any) => {
    return sheetSchema.properties.name?.enum?.[0] || "Unnamed Sheet"
  })
}
