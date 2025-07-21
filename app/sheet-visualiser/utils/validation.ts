import type { WorkbookData, SheetSchema, ValidationError, FieldSchema } from "../types"
import { getBlockSchema } from "./schema"

export function validateAllCells(
  workbookData: WorkbookData,
  schema: SheetSchema,
  sheetIndex: number,
  blockIndex: number,
): ValidationError[] {
  const errors: ValidationError[] = []

  const sheetName = workbookData.sheets[sheetIndex].name;

  const blockName = workbookData.sheets[sheetIndex].blocks[blockIndex].name

  // Find sheet by name
  const sheet = workbookData.sheets.find((s) => s.name === sheetName)
  if (!sheet) return errors

  // Find block by name
  const block = sheet.blocks.find((b) => b.name === blockName)
  if (!block) return errors

  if (block["@entity"] === "table" && block.rows) {
    block.rows.forEach((row, rowIndex) => {
    if(row){
      row.forEach((cell, colIndex) => {
        const fieldSchema = getFieldSchema(schema, sheet.name, block.name, colIndex)
        if (fieldSchema) {
          const error = validateCell(cell, fieldSchema, rowIndex, colIndex)
          if (error) {
            errors.push(error)
          }
        }
      })
    }
    })
  } else if (block["@entity"] === "list" && block.items) {
    const blockSchema = getBlockSchema(schema, sheetName, blockName);
    const itemSchema = blockSchema?.properties.items?.items;
    const schemaKeys = (itemSchema && 'properties' in itemSchema) ? Object.keys(itemSchema.properties) : [];
  
    block.items.forEach((item, itemIndex) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        Object.entries(item).forEach(([key, value]) => {
          const fieldSchema = getFieldSchema(schema, sheetName, blockName, key);
          if (fieldSchema) {
            // Find the original index of the key in the object
            const originalKeyIndex = Object.keys(item).indexOf(key);
  
            // Since we are rendering key-value pairs, the value is always in the second column (index 1)
            const error = validateCell(value, fieldSchema, itemIndex, 1);
            if (error) {
              errors.push(error);
            }
          }
        });
      } else if (Array.isArray(item)) {
        item.forEach((value, colIndex) => {
          const fieldSchema = getFieldSchema(schema, sheetName, blockName, colIndex);
          if (fieldSchema) {
            const error = validateCell(value, fieldSchema, itemIndex, colIndex);
            if (error) {
              errors.push(error);
            }
          }
        });
      }
    });
  }

  return errors
}

export function getFieldSchema(
  schema: SheetSchema | null,
  sheetName: string,
  blockName: string,
  fieldIdentifier: number | string,
): FieldSchema | null {
  if (!schema || !schema.properties.sheets.items.oneOf) {
    return null
  }

  // Find sheet schema by name
  const sheetSchema = schema.properties.sheets.items.oneOf.find((s: any) => s.properties.name?.enum?.[0] === sheetName)
  if (!sheetSchema) return null

  // Find block schema by name
  const blockSchema = sheetSchema.properties.blocks.items.oneOf.find(
    (b: any) => b.properties?.name?.enum?.[0] === blockName,
  )
  if (!blockSchema) return null

  if (blockSchema.properties["@entity"].enum[0] === "table" && blockSchema.properties.rows) {
    if (typeof fieldIdentifier === 'number') {
        const rowSchema = blockSchema.properties.rows.items
        if (rowSchema.items && Array.isArray(rowSchema.items) && rowSchema.items[fieldIdentifier]) {
          return rowSchema.items[fieldIdentifier]
        }
    }
  } else if (blockSchema.properties["@entity"].enum[0] === "list" && blockSchema.properties.items) {
    const itemsSchema = blockSchema.properties.items.items
    if (itemsSchema && typeof itemsSchema === "object" && "properties" in itemsSchema) {
        if(typeof fieldIdentifier === 'string') {
            return itemsSchema.properties[fieldIdentifier] || null
        }
        if (typeof fieldIdentifier === 'number') {
            const keys = Object.keys(itemsSchema.properties);
            const key = keys[fieldIdentifier];
            if(key) return itemsSchema.properties[key];
        }
    } else if (Array.isArray(itemsSchema) && typeof fieldIdentifier === 'number' && itemsSchema[fieldIdentifier]) {
      return itemsSchema[fieldIdentifier]
    }
  }

  return null
}

export function validateCell(value: any, fieldSchema: FieldSchema, row: number, col: number): ValidationError | null {
  // Handle null/undefined values
  if (value === null || value === undefined || value === "") {
    if (!fieldSchema.nullAllowed && !(Array.isArray(fieldSchema.type) && fieldSchema.type.includes("null"))) {
      return {
        row,
        col,
        message: "Value is required",
        severity: "error",
      }
    }
    return null
  }

  const stringValue = String(value)
  const types = Array.isArray(fieldSchema.type) ? fieldSchema.type : [fieldSchema.type]

  // Type validation
  let typeValid = false
  for (const type of types) {
    switch (type) {
      case "string":
        typeValid = true // Any value can be converted to string
        break
      case "number":
        typeValid = !isNaN(Number(stringValue)) && isFinite(Number(stringValue))
        break
      case "integer":
        typeValid = Number.isInteger(Number(stringValue))
        break
      case "boolean":
        typeValid = stringValue.toLowerCase() === "true" || stringValue.toLowerCase() === "false"
        break
      case "object":
        try {
          JSON.parse(stringValue)
          typeValid = true
        } catch {
          typeValid = false
        }
        break
      case "array":
        try {
          const parsed = JSON.parse(stringValue)
          typeValid = Array.isArray(parsed)
        } catch {
          typeValid = false
        }
        break
    }
    if (typeValid) break
  }

  if (!typeValid) {
    return {
      row,
      col,
      message: `Expected ${types.join(" or ")}, got ${typeof value}`,
      severity: "error",
    }
  }

  // String length validation
  if (types.includes("string")) {
    if (fieldSchema.minLength !== undefined && stringValue.length < fieldSchema.minLength) {
      return {
        row,
        col,
        message: `Minimum length is ${fieldSchema.minLength}`,
        severity: "error",
      }
    }
    if (fieldSchema.maxLength !== undefined && stringValue.length > fieldSchema.maxLength) {
      return {
        row,
        col,
        message: `Maximum length is ${fieldSchema.maxLength}`,
        severity: "error",
      }
    }
  }

  // Numeric range validation
  if (types.includes("number") || types.includes("integer")) {
    const numValue = Number(stringValue)
    if (fieldSchema.minimum !== undefined && numValue < fieldSchema.minimum) {
      return {
        row,
        col,
        message: `Minimum value is ${fieldSchema.minimum}`,
        severity: "error",
      }
    }
    if (fieldSchema.maximum !== undefined && numValue > fieldSchema.maximum) {
      return {
        row,
        col,
        message: `Maximum value is ${fieldSchema.maximum}`,
        severity: "error",
      }
    }
  }

  // Enum validation
  if (fieldSchema.enum && !fieldSchema.enum.includes(stringValue)) {
    return {
      row,
      col,
      message: `Must be one of: ${fieldSchema.enum.join(", ")}`,
      severity: "error",
    }
  }

  // Pattern validation
  if (fieldSchema.pattern) {
    try {
      
      const regex = new RegExp(fieldSchema.pattern)
      if (!regex.test(stringValue)) {
        return {
          row,
          col,
          message: "Does not match required pattern",
          severity: "error",
        }
      }
    } catch {
      // Invalid regex pattern in schema
    }
  }

  return null
}

export function getCellValidationError(
  validationErrors: ValidationError[],
  row: number,
  col: number,
): ValidationError | null {
  return validationErrors.find((error) => error.row === row && error.col === col) || null
}
