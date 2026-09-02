import type { ListBlock, TableBlock, KeyValuePair, TableHeader } from "@/types/schema"
import { useSchemaStore } from "@/store/schema-store"
import { workbookNameExistsInStorage } from "@/lib/workbook-storage"

/**
 * Thrown by `importSchemaFromUrl` when the schema's workbook name collides
 * with an already-existing workbook and the caller hasn't explicitly opted
 * in to overwriting it.
 */
export class WorkbookNameConflictError extends Error {
  workbookName: string

  constructor(workbookName: string) {
    super(`A workbook named "${workbookName}" already exists.`)
    this.name = "WorkbookNameConflictError"
    this.workbookName = workbookName
  }
}

/** Validates a JSON Schema is a workbook schema and extracts its workbook name. */
export function extractWorkbookNameFromSchema(schema: any): string {
  if (!schema.$schema || !schema.properties) {
    throw new Error("Invalid JSON Schema format. Expected schema with $schema and properties.")
  }

  const workbookNameEnum = schema.properties.name?.enum
  const workbookEntityEnum = schema.properties["@entity"]?.enum
  const sheetsProperty = schema.properties.sheets

  if (!workbookNameEnum || !workbookEntityEnum || workbookEntityEnum[0] !== "workbook" || !sheetsProperty) {
    throw new Error("Invalid workbook schema structure.")
  }

  return workbookNameEnum[0]
}

export async function importSchemaFromUrl(url: string, options?: { overwrite?: boolean }): Promise<void> {
  const { createWorkbook, deleteWorkbookByName, createSheet, createBlock } = useSchemaStore.getState()

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }

  const schemaText = await response.text()
  const schema = JSON.parse(schemaText)

  // Validate this is a JSON Schema and extract structure
  const sheetsProperty = schema.properties?.sheets
  const workbookName = extractWorkbookNameFromSchema(schema)

  if (!options?.overwrite && (await workbookNameExistsInStorage(workbookName))) {
    throw new WorkbookNameConflictError(workbookName)
  }

  if (options?.overwrite) {
    deleteWorkbookByName(workbookName)
  }

  // Create workbook
  createWorkbook(workbookName)

  // Wait for workbook creation
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Get the newly created workbook
  let currentWorkbooks = useSchemaStore.getState().workbooks
  const newWorkbook = currentWorkbooks[currentWorkbooks.length - 1]

  if (!newWorkbook) {
    throw new Error("Failed to create workbook")
  }

  // Process sheets
  const sheetSchemas = sheetsProperty.items?.oneOf || []

  for (let sheetIndex = 0; sheetIndex < sheetSchemas.length; sheetIndex++) {
    const sheetSchema = sheetSchemas[sheetIndex]

    const sheetNameEnum = sheetSchema.properties?.name?.enum
    const sheetEntityEnum = sheetSchema.properties?.["@entity"]?.enum
    const blocksProperty = sheetSchema.properties?.blocks

    if (!sheetNameEnum || !sheetEntityEnum || sheetEntityEnum[0] !== "sheet") {
      continue
    }

    const sheetName = sheetNameEnum[0]

    // Create sheet
    createSheet(newWorkbook.id, sheetName)

    // Wait for sheet creation
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Refresh workbooks state and get the updated workbook
    currentWorkbooks = useSchemaStore.getState().workbooks
    const updatedWorkbook = currentWorkbooks.find((wb) => wb.id === newWorkbook.id)
    const newSheet = updatedWorkbook?.sheets[updatedWorkbook.sheets.length - 1]

    if (!newSheet) {
      continue
    }

    // Process blocks for this sheet
    if (blocksProperty && blocksProperty.items && blocksProperty.items.oneOf) {
      const blockSchemas = blocksProperty.items.oneOf

      for (let blockIndex = 0; blockIndex < blockSchemas.length; blockIndex++) {
        const blockSchema = blockSchemas[blockIndex]

        const blockNameEnum = blockSchema.properties?.name?.enum
        const blockEntityEnum = blockSchema.properties?.["@entity"]?.enum

        if (!blockNameEnum || !blockEntityEnum) {
          continue
        }

        const blockName = blockNameEnum[0]
        const blockType = blockEntityEnum[0]

        if (blockType === "list") {
          // Process list block
          const listBlock: ListBlock = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: "list",
            name: blockName,
            items: [],
          }

          // Extract field definitions from items.items.properties
          const itemsProperty = blockSchema.properties?.items
          const itemProperties = itemsProperty?.items?.properties

          if (itemProperties) {
            Object.entries(itemProperties).forEach(([fieldName, fieldSchema]: [string, any]) => {
              const item: KeyValuePair = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                key: fieldName,
                value: fieldSchema.examples?.[0] || "",
                type: Array.isArray(fieldSchema.type) ? fieldSchema.type[0] : fieldSchema.type || "string",
                nullAllowed: Array.isArray(fieldSchema.type) && fieldSchema.type.includes("null"),
                description: fieldSchema.description,
                examples: fieldSchema.examples,
                pattern: fieldSchema.pattern,
                minLength: fieldSchema.minLength,
                maxLength: fieldSchema.maxLength,
                minimum: fieldSchema.minimum,
                maximum: fieldSchema.maximum,
                enum: fieldSchema.enum,
                format: fieldSchema.format
                  ? fieldSchema.format === "Long"
                    ? "Long"
                    : fieldSchema.format === "BigDecimal"
                      ? "BigDecimal"
                      : undefined
                  : undefined,
              }
              listBlock.items.push(item)
            })
          }

          createBlock(newWorkbook.id, newSheet.id, listBlock)
        } else if (blockType === "table") {
          // Process table block
          const tableBlock: TableBlock = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: "table",
            name: blockName,
            headers: [],
            rows: [],
          }

          // Extract header definitions
          const headerProperty = blockSchema.properties?.header
          const rowsProperty = blockSchema.properties?.rows

          if (headerProperty?.items && rowsProperty?.items?.items) {
            const headerItems = headerProperty.items
            const rowItems = rowsProperty.items.items

            headerItems.forEach((headerItem: any, index: number) => {
              const headerName = headerItem.enum?.[0] || `column_${index + 1}`
              const rowFieldSchema = rowItems[index] || {}

              const header: TableHeader = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: headerName,
                type: Array.isArray(rowFieldSchema.type) ? rowFieldSchema.type[0] : rowFieldSchema.type || "string",
                nullAllowed: Array.isArray(rowFieldSchema.type) && rowFieldSchema.type.includes("null"),
                description: rowFieldSchema.description,
                examples: rowFieldSchema.examples,
                pattern: rowFieldSchema.pattern,
                minLength: rowFieldSchema.minLength,
                maxLength: rowFieldSchema.maxLength,
                minimum: rowFieldSchema.minimum,
                maximum: rowFieldSchema.maximum,
                enum: rowFieldSchema.enum,
                format: rowFieldSchema.format
                  ? rowFieldSchema.format === "Long"
                    ? "Long"
                    : rowFieldSchema.format === "BigDecimal"
                      ? "BigDecimal"
                      : undefined
                  : undefined,
              }
              tableBlock.headers.push(header)
            })
          }

          createBlock(newWorkbook.id, newSheet.id, tableBlock)
        }

        // Small delay between block creations
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Small delay between sheet processing
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
