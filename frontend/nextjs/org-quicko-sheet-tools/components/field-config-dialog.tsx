"use client"

import type React from "react"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { KeyValuePair, TableHeader } from "@/types/schema"

interface FieldConfigDialogProps {
  field: KeyValuePair | TableHeader
  onSave: (field: KeyValuePair | TableHeader) => void
  trigger?: React.ReactNode
}

export function FieldConfigDialog({ field, onSave, trigger }: FieldConfigDialogProps) {
  const updateField = (updates: Partial<KeyValuePair | TableHeader>) => {
    const updatedField = { ...field, ...updates }
    onSave(updatedField)
  }

  const fieldName = "key" in field ? field.key : field.name
  const isKeyValuePair = "key" in field

  // Check if format field should be shown (only for number and integer types)
  const showFormatField = field.type === "number" || field.type === "integer"

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>Configure Field: {fieldName || "Unnamed"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Field Name */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Field Information</h3>

            <div>
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                placeholder="Enter field name"
                value={fieldName || ""}
                onChange={(e) => {
                  if (isKeyValuePair) {
                    updateField({ key: e.target.value })
                  } else {
                    updateField({ name: e.target.value })
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Basic Properties */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Properties</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(value: any) => updateField({ type: value, format: undefined })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="integer">Integer</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showFormatField && (
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={field.format || "None"}
                    onValueChange={(value: any) => updateField({ format: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Long">Long</SelectItem>
                      <SelectItem value="BigDecimal">BigDecimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="nullAllowed"
                checked={field.nullAllowed || false}
                onCheckedChange={(checked) => updateField({ nullAllowed: checked })}
              />
              <Label htmlFor="nullAllowed">Null Allowed</Label>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Field description"
                value={field.description || ""}
                onChange={(e) => updateField({ description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="examples">Examples (comma-separated)</Label>
              <Input
                id="examples"
                placeholder="example1, example2, example3"
                value={field.examples?.join(", ") || ""}
                onChange={(e) =>
                  updateField({
                    examples: e.target.value ? e.target.value.split(",").map((s) => s.trim()) : undefined,
                  })
                }
              />
            </div>
          </div>

          <Separator />

          {/* String Validations */}
          {field.type === "string" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">String Validations</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minLength">Min Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    placeholder="0"
                    value={field.minLength || ""}
                    onChange={(e) =>
                      updateField({
                        minLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxLength">Max Length</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    placeholder="255"
                    value={field.maxLength || ""}
                    onChange={(e) =>
                      updateField({
                        maxLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pattern">Pattern (Regex)</Label>
                <Input
                  id="pattern"
                  placeholder="^[a-zA-Z0-9]+$"
                  value={field.pattern || ""}
                  onChange={(e) => updateField({ pattern: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Number/Integer Validations */}
          {(field.type === "number" || field.type === "integer") && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Numeric Validations</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum">Minimum</Label>
                  <Input
                    id="minimum"
                    type="number"
                    step="any"
                    value={field.minimum !== undefined ? field.minimum.toString() : ""}
                    onChange={(e) =>
                      updateField({
                        minimum: e.target.value !== "" ? Number.parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maximum">Maximum</Label>
                  <Input
                    id="maximum"
                    type="number"
                    step="any"
                    value={field.maximum !== undefined ? field.maximum.toString() : ""}
                    onChange={(e) =>
                      updateField({
                        maximum: e.target.value !== "" ? Number.parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Enum Values */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enum Values</h3>
            <div>
              <Label htmlFor="enumValues">Allowed Values (comma-separated)</Label>
              <Input
                id="enumValues"
                placeholder="option1, option2, option3"
                value={field.enum?.join(", ") || ""}
                onChange={(e) =>
                  updateField({
                    enum: e.target.value ? e.target.value.split(",").map((s) => s.trim()) : undefined,
                  })
                }
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty to allow any value of the specified type</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
