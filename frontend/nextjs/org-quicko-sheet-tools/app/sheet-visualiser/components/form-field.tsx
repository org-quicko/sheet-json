"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { FieldSchema } from "../types"

interface FormFieldProps {
  id: string
  label: string
  fieldSchema: FieldSchema
  value: string
  onChange: (value: string) => void
  error?: string
}

export function FormField({ id, label, fieldSchema, value, onChange, error }: FormFieldProps) {
  const types = Array.isArray(fieldSchema.type) ? fieldSchema.type : [fieldSchema.type]
  const primaryType = types[0]
  const isRequired = !fieldSchema.nullAllowed && !types.includes("null")
  const safeLabel = label || ""

  const renderInput = () => {
    // Handle enum fields with select dropdown
    if (fieldSchema.enum && fieldSchema.enum.length > 0) {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${safeLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {fieldSchema.enum.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Handle boolean fields with checkbox
    if (primaryType === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={id}
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          />
          <Label htmlFor={id} className="text-sm font-normal">
            {label}
          </Label>
        </div>
      )
    }

    // Handle multiline text (object/array or long strings)
    if (primaryType === "object" || primaryType === "array" || (fieldSchema.maxLength && fieldSchema.maxLength > 100)) {
      return (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            primaryType === "object"
              ? '{"key": "value"}'
              : primaryType === "array"
                ? '["item1", "item2"]'
                : `Enter ${safeLabel.toLowerCase()}`
          }
          className={error ? "border-red-500" : ""}
          rows={3}
        />
      )
    }

    // Determine input type based on field schema
    let inputType = "text"
    const inputProps: any = {}

    if (primaryType === "number" || primaryType === "integer") {
      inputType = "number"
      if (fieldSchema.minimum !== undefined) inputProps.min = fieldSchema.minimum
      if (fieldSchema.maximum !== undefined) inputProps.max = fieldSchema.maximum
      if (primaryType === "integer") inputProps.step = 1
    } else if (fieldSchema.format) {
      switch (fieldSchema.format) {
        case "email":
          inputType = "email"
          break
        case "date":
          inputType = "date"
          break
        case "date-time":
          inputType = "datetime-local"
          break
        case "time":
          inputType = "time"
          break
        case "uri":
        case "url":
          inputType = "url"
          break
        case "password":
          inputType = "password"
          break
      }
    }

    // Add string length constraints
    if (primaryType === "string") {
      if (fieldSchema.minLength !== undefined) inputProps.minLength = fieldSchema.minLength
      if (fieldSchema.maxLength !== undefined) inputProps.maxLength = fieldSchema.maxLength
      if (fieldSchema.pattern) inputProps.pattern = fieldSchema.pattern
    }

    return (
      <Input
        id={id}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${safeLabel.toLowerCase()}`}
        className={error ? "border-red-500" : ""}
        required={isRequired}
        {...inputProps}
      />
    )
  }

  // Don't render label for boolean fields (checkbox handles its own label)
  if (primaryType === "boolean") {
    return (
      <div className="space-y-2">
        {renderInput()}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">
          {types.join(" | ")}
        </Badge>
      </div>
      {renderInput()}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {fieldSchema.description && <p className="text-xs text-gray-500">{fieldSchema.description}</p>}
    </div>
  )
}
