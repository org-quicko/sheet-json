"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { SheetSchema, FieldSchema } from "../types"
import { getBlockSchema } from "../utils/schema"
import { validateCell } from "../utils/validation"
import { FormField } from "./form-field"

interface AddDataDialogProps {
  currentBlock: any
  currentSheetName: string
  workbookSchema: SheetSchema | null
  onAddData: (data: any) => void
  onUpdateData?: (data: any, index: number) => void
  editingIndex?: number
}

export function AddDataDialog({
  currentBlock,
  currentSheetName,
  workbookSchema,
  onAddData,
  onUpdateData,
  editingIndex,
}: AddDataDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dynamicFields, setDynamicFields] = useState<Array<{ key: string; value: string }>>([])
  const prevOpen = useRef(open)

  const blockSchema = workbookSchema ? getBlockSchema(workbookSchema, currentSheetName, currentBlock?.name) : null
  const isEditing = editingIndex !== undefined
  const isListBlock = currentBlock?.["@entity"] === "list"
  const hasSchema = !!blockSchema

  useEffect(() => {
    if (open && !prevOpen.current) {
      setErrors({})

      if (isEditing && isListBlock && currentBlock.items && currentBlock.items[editingIndex]) {
        // Pre-fill form with existing data for list editing
        const existingItem = currentBlock.items[editingIndex]
        if (typeof existingItem === "object" && existingItem !== null && !Array.isArray(existingItem)) {
          if (hasSchema) {
            const newFormData: Record<string, string> = {}
            Object.entries(existingItem).forEach(([key, value]) => {
              newFormData[key] = String(value || "")
            })
            setFormData(newFormData)
          } else {
            // For dynamic fields without schema
            const fields = Object.entries(existingItem).map(([key, value]) => ({
              key,
              value: String(value || ""),
            }))
            setDynamicFields(fields)
          }
        } else {
          if (hasSchema) {
            setFormData({ value: String(existingItem || "") })
          } else {
            setDynamicFields([{ key: "value", value: String(existingItem || "") }])
          }
        }
      } else if (
        isEditing &&
        currentBlock["@entity"] === "table" &&
        currentBlock.rows &&
        currentBlock.rows[editingIndex]
      ) {
        // Pre-fill form with existing table row data
        const existingRow = currentBlock.rows[editingIndex]
        if (hasSchema && currentBlock.header) {
          const newFormData: Record<string, string> = {}
          currentBlock.header.forEach((header: string, index: number) => {
            newFormData[header] = String(existingRow[index] || "")
          })
          setFormData(newFormData)
        } else {
          // For dynamic table without schema
          const fields = existingRow.map((value: any, index: number) => ({
            key: currentBlock.header?.[index] || `Column ${index + 1}`,
            value: String(value || ""),
          }))
          setDynamicFields(fields)
        }
      } else {
        // New data entry
        if (hasSchema) {
          setFormData({})
        } else {
          // Start with one empty field for dynamic entry
          if (currentBlock["@entity"] === "table" && currentBlock.header) {
            setDynamicFields(currentBlock.header.map((header: string) => ({ key: header, value: "" })))
          } else {
            setDynamicFields([{ key: "", value: "" }])
          }
        }
      }
    }
    prevOpen.current = open
  }, [open, currentBlock, editingIndex, isEditing, isListBlock, hasSchema])

  if (!currentBlock) {
    return (
      <Button disabled variant="outline" size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Add Data (No Block Selected)
      </Button>
    )
  }

  const handleValidation = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (hasSchema) {
      if (currentBlock["@entity"] === "table" && blockSchema?.properties?.rows?.items?.items) {
        const fields = blockSchema.properties.rows.items.items as FieldSchema[]
        fields.forEach((field, index) => {
          const header = currentBlock.header[index]
          const value = formData[header] || ""
          const error = validateCell(value, field, 0, 0)
          if (error) {
            newErrors[header] = error.message
            isValid = false
          }
        })
      } else if (currentBlock["@entity"] === "list" && blockSchema?.properties?.items?.items) {
        const itemSchema = blockSchema.properties.items.items
        if ("properties" in itemSchema) {
          Object.entries(itemSchema.properties).forEach(([key, fieldSchema]) => {
            const value = formData[key] || ""
            const error = validateCell(value, fieldSchema, 0, 0)
            if (error) {
              newErrors[key] = error.message
              isValid = false
            }
          })
        } else {
          const value = formData.value || ""
          const error = validateCell(value, itemSchema as FieldSchema, 0, 0)
          if (error) {
            newErrors.value = error.message
            isValid = false
          }
        }
      }
    } else {
      // Basic validation for dynamic fields
      if (currentBlock["@entity"] === "list") {
        dynamicFields.forEach((field, index) => {
          if (!field.key.trim()) {
            newErrors[`key_${index}`] = "Key is required"
            isValid = false
          }
        })
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = () => {
    if (!handleValidation()) {
      return
    }

    const convertValue = (value: string, schema?: FieldSchema): any => {
      if (!schema) return value // No schema, return as string

      if (value === "" || value === null || value === undefined) {
        return schema.nullAllowed ? null : ""
      }

      const types = Array.isArray(schema.type) ? schema.type : [schema.type]

      if (types.includes("number") || types.includes("integer")) {
        const num = Number(value)
        if (!isNaN(num) && isFinite(num)) return num
      }

      if (types.includes("boolean")) {
        return value === "true"
      }

      if (types.includes("object") || types.includes("array")) {
        try {
          return JSON.parse(value)
        } catch (e) {
          // fall through to return string if not valid JSON
        }
      }

      return value // Default to string
    }

    if (currentBlock["@entity"] === "table") {
      if (hasSchema && blockSchema?.properties?.rows?.items?.items) {
        const fields = blockSchema.properties.rows.items.items as FieldSchema[]
        const newRow =
          currentBlock.header?.map((header: string, index: number) => {
            const fieldSchema = fields[index]
            const value = formData[header] || ""
            return convertValue(value, fieldSchema)
          }) || []

        if (isEditing && onUpdateData) {
          onUpdateData(newRow, editingIndex)
        } else {
          onAddData(newRow)
        }
      } else {
        // Dynamic table without schema
        const newRow = dynamicFields.map((field) => field.value)

        if (isEditing && onUpdateData) {
          onUpdateData(newRow, editingIndex)
        } else {
          onAddData(newRow)
        }
      }
    } else if (currentBlock["@entity"] === "list") {
      if (hasSchema && blockSchema?.properties?.items?.items) {
        const itemSchema = blockSchema.properties.items.items

        if ("properties" in itemSchema) {
          const newItem: Record<string, any> = {}
          Object.entries(itemSchema.properties).forEach(([key, fieldSchema]) => {
            const value = formData[key] || ""
            newItem[key] = convertValue(value, fieldSchema)
          })

          if (isEditing && onUpdateData) {
            onUpdateData(newItem, editingIndex)
          } else {
            onAddData(newItem)
          }
        } else {
          const value = formData.value || ""
          const newItem = convertValue(value, itemSchema as FieldSchema)

          if (isEditing && onUpdateData) {
            onUpdateData(newItem, editingIndex)
          } else {
            onAddData(newItem)
          }
        }
      } else {
        // Dynamic list without schema
        if (dynamicFields.length === 1 && !dynamicFields[0].key) {
          // Simple value
          const newItem = dynamicFields[0].value
          if (isEditing && onUpdateData) {
            onUpdateData(newItem, editingIndex)
          } else {
            onAddData(newItem)
          }
        } else {
          // Object with key-value pairs
          const newItem: Record<string, any> = {}
          dynamicFields.forEach((field) => {
            if (field.key.trim()) {
              newItem[field.key] = field.value
            }
          })

          if (isEditing && onUpdateData) {
            onUpdateData(newItem, editingIndex)
          } else {
            onAddData(newItem)
          }
        }
      }
    }

    setOpen(false)
  }

  const addDynamicField = () => {
    setDynamicFields([...dynamicFields, { key: "", value: "" }])
  }

  const removeDynamicField = (index: number) => {
    setDynamicFields(dynamicFields.filter((_, i) => i !== index))
  }

  const updateDynamicField = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...dynamicFields]
    updated[index][field] = newValue
    setDynamicFields(updated)
  }

  const renderFormFields = () => {
    if (hasSchema && blockSchema) {
      // Schema-based form
      if (currentBlock["@entity"] === "table" && blockSchema.properties?.rows?.items?.items) {
        const fields = blockSchema.properties.rows.items.items as FieldSchema[]
        return fields.map((field, index) => {
          const header = currentBlock.header[index]
          return (
            <FormField
              key={header}
              id={header}
              label={header}
              fieldSchema={field}
              value={formData[header] || ""}
              onChange={(value) => setFormData({ ...formData, [header]: value })}
              error={errors[header]}
            />
          )
        })
      } else if (currentBlock["@entity"] === "list" && blockSchema.properties?.items?.items) {
        const itemSchema = blockSchema.properties.items.items
        if ("properties" in itemSchema) {
          return Object.entries(itemSchema.properties).map(([key, fieldSchema]) => (
            <FormField
              key={key}
              id={key}
              label={key}
              fieldSchema={fieldSchema}
              value={formData[key] || ""}
              onChange={(value) => setFormData({ ...formData, [key]: value })}
              error={errors[key]}
            />
          ))
        } else {
          return (
            <FormField
              id="value"
              label="Value"
              fieldSchema={itemSchema as FieldSchema}
              value={formData.value || ""}
              onChange={(value) => setFormData({ ...formData, value: value })}
              error={errors.value}
            />
          )
        }
      }
    } else {
      // Dynamic form without schema
      return (
        <div className="space-y-4">
          {currentBlock["@entity"] === "table" ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Table Row Data</Label>
              {dynamicFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`field_${index}`} className="text-xs text-gray-600">
                      {field.key || `Column ${index + 1}`}
                    </Label>
                    <Input
                      id={`field_${index}`}
                      value={field.value}
                      onChange={(e) => updateDynamicField(index, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">List Item Data</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDynamicField}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Field
                </Button>
              </div>
              {dynamicFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`key_${index}`} className="text-xs text-gray-600">
                      Key
                    </Label>
                    <Input
                      id={`key_${index}`}
                      value={field.key}
                      onChange={(e) => updateDynamicField(index, "key", e.target.value)}
                      placeholder="Enter key"
                      className={errors[`key_${index}`] ? "border-red-500" : ""}
                    />
                    {errors[`key_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`key_${index}`]}</p>}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`value_${index}`} className="text-xs text-gray-600">
                      Value
                    </Label>
                    <Input
                      id={`value_${index}`}
                      value={field.value}
                      onChange={(e) => updateDynamicField(index, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  {dynamicFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDynamicField(index)}
                      className="px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return <p>This block type is not supported for data entry.</p>
  }

  const buttonText = isListBlock ? (isEditing ? "Edit Data" : "Add Data") : "Add Data"
  const dialogTitle = isListBlock ? (isEditing ? "Edit Item" : "Add New Item") : isEditing ? "Edit Row" : "Add New Row"
  const dialogDescription = hasSchema
    ? isEditing
      ? `Update the details for this ${currentBlock["@entity"] === "table" ? "row" : "item"} using the schema validation.`
      : `Fill in the details for the new ${currentBlock["@entity"] === "table" ? "row" : "item"} using the schema validation.`
    : isEditing
      ? `Update the details for this ${currentBlock["@entity"] === "table" ? "row" : "item"}. No schema validation applied.`
      : `Fill in the details for the new ${currentBlock["@entity"] === "table" ? "row" : "item"}. No schema validation applied.`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {isListBlock && isEditing ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {dialogTitle}
            {hasSchema && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Schema Validated</span>
            )}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">{renderFormFields()}</div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {isEditing ? "Update" : "Add"} {currentBlock["@entity"] === "table" ? "Row" : "Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
