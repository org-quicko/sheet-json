"use client"

import { useState, useEffect } from "react"
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
import { Plus, Edit } from "lucide-react"
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

  const blockSchema = workbookSchema ? getBlockSchema(workbookSchema, currentSheetName, currentBlock?.name) : null
  const isEditing = editingIndex !== undefined
  const isListBlock = currentBlock?.["@entity"] === "list"

  useEffect(() => {
    if (open) {
      setErrors({})

      if (isEditing && isListBlock && currentBlock.items && currentBlock.items[editingIndex]) {
        // Pre-fill form with existing data for list editing
        const existingItem = currentBlock.items[editingIndex]
        if (typeof existingItem === "object" && existingItem !== null && !Array.isArray(existingItem)) {
          const newFormData: Record<string, string> = {}
          Object.entries(existingItem).forEach(([key, value]) => {
            newFormData[key] = String(value || "")
          })
          setFormData(newFormData)
        } else {
          setFormData({ value: String(existingItem || "") })
        }
      } else {
        setFormData({})
      }
    }
  }, [open, currentBlock, editingIndex, isEditing, isListBlock])

  if (!currentBlock || !blockSchema) {
    return (
      <Button disabled variant="outline" size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Add Data (Schema Required)
      </Button>
    )
  }

  const handleValidation = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

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

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = () => {
    if (!handleValidation()) {
      return
    }

    const convertValue = (value: string, schema: FieldSchema): any => {
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

    if (currentBlock["@entity"] === "table" && blockSchema?.properties?.rows?.items?.items) {
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
    } else if (currentBlock["@entity"] === "list" && blockSchema?.properties?.items?.items) {
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
    }

    setOpen(false)
  }

  const renderFormFields = () => {
    if (!blockSchema) return null

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

    return <p>This block type is not supported for data entry.</p>
  }

  const buttonText = isListBlock ? (isEditing ? "Edit Data" : "Add Data") : "Add Data"

  const dialogTitle = isListBlock ? (isEditing ? "Edit Item" : "Add New Item") : isEditing ? "Edit Row" : "Add New Row"

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
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the details for this ${currentBlock["@entity"] === "table" ? "row" : "item"}.`
              : `Fill in the details for the new ${currentBlock["@entity"] === "table" ? "row" : "item"}.`}
          </DialogDescription>
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
