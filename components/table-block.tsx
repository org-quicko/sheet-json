"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FieldConfigDialog } from "./field-config-dialog"
import type { TableBlock, TableHeader as TableHeaderType } from "@/types/schema"

interface TableBlockComponentProps {
  block: TableBlock
  onUpdate: (block: TableBlock) => void
  onDelete: () => void
}

export function TableBlockComponent({ block, onUpdate, onDelete }: TableBlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(block.name)

  const addHeader = () => {
    const newHeader: TableHeaderType = {
      id: Date.now().toString(),
      name: "",
      type: "string",
      nullAllowed: false,
    }
    onUpdate({
      ...block,
      headers: [...block.headers, newHeader],
    })
  }

  const updateHeader = (headerId: string, updates: Partial<TableHeaderType>) => {
    onUpdate({
      ...block,
      headers: block.headers.map((header) => (header.id === headerId ? { ...header, ...updates } : header)),
    })
  }

  const deleteHeader = (headerId: string) => {
    onUpdate({
      ...block,
      headers: block.headers.filter((header) => header.id !== headerId),
      rows: block.rows.map((row) => ({
        ...row,
        cells: Object.fromEntries(Object.entries(row.cells).filter(([key]) => key !== headerId)),
      })),
    })
  }

  const saveName = () => {
    onUpdate({ ...block, name: editingName })
    setIsEditing(false)
  }

  const getTypeColor = (type: string) => {
    const colors = {
      string: "bg-blue-100 text-blue-800",
      number: "bg-green-100 text-green-800",
      integer: "bg-purple-100 text-purple-800",
      boolean: "bg-yellow-100 text-yellow-800",
      object: "bg-red-100 text-red-800",
      array: "bg-pink-100 text-pink-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getFormatColor = (format: string) => {
    const colors = {
      Long: "bg-indigo-100 text-indigo-800",
      BigDecimal: "bg-teal-100 text-teal-800",
    }
    return colors[format as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div className="space-y-3">
        {block.headers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">No columns defined yet</p>
            <Button onClick={addHeader}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Column
            </Button>
          </div>
        ) : (
          block.headers.map((header) => (
            <div key={header.id} className="p-4 border rounded-lg space-y-3 bg-white shadow-sm">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Column name"
                  value={header.name}
                  onChange={(e) => updateHeader(header.id, { name: e.target.value })}
                  className="flex-1"
                />
                <FieldConfigDialog
                  field={header}
                  onSave={(updatedField) => updateHeader(header.id, updatedField as TableHeaderType)}
                />
                <Button size="sm" variant="destructive" onClick={() => deleteHeader(header.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2 flex-wrap">
                <Badge className={getTypeColor(header.type)}>{header.type}</Badge>
                {header.format && <Badge className={getFormatColor(header.format)}>{header.format}</Badge>}
                {header.nullAllowed && <Badge variant="outline">Nullable</Badge>}
                {header.enum && header.enum.length > 0 && (
                  <Badge variant="secondary">Enum: {header.enum.join(", ")}</Badge>
                )}
                {header.pattern && <Badge variant="secondary">Pattern</Badge>}
                {(header.minLength || header.maxLength) && (
                  <Badge variant="secondary">
                    Length: {header.minLength || 0}-{header.maxLength || "∞"}
                  </Badge>
                )}
                {(header.minimum !== undefined || header.maximum !== undefined) && (
                  <Badge variant="secondary">
                    Range: {header.minimum !== undefined ? (header.format === "BigDecimal" ? "0.0" : "0") : header.minimum } to{" "}
                    {header.maximum !== undefined ? header.maximum : "∞"}
                  </Badge>
                )}
              </div>

              {header.description && <p className="text-sm text-gray-600">{header.description}</p>}

              {header.examples && header.examples.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500">Examples: </span>
                  <span className="font-mono text-xs bg-gray-100 px-1 rounded">{header.examples.join(", ")}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
