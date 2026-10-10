"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [draggedHeader, setDraggedHeader] = useState<string | null>(null)
  const [dragOverHeader, setDragOverHeader] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

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
    })
  }

  const reorderHeaders = (draggedId: string, targetId: string) => {
    const draggedIndex = block.headers.findIndex((header) => header.id === draggedId)
    const targetIndex = block.headers.findIndex((header) => header.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newHeaders = [...block.headers]
    const [draggedHeader] = newHeaders.splice(draggedIndex, 1)
    newHeaders.splice(targetIndex, 0, draggedHeader)

    onUpdate({
      ...block,
      headers: newHeaders,
    })
  }

  const handleAutoScroll = useCallback((clientY: number) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const scrollThreshold = 50
    const scrollSpeed = 10

    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current)
      autoScrollRef.current = null
    }

    if (clientY - rect.top < scrollThreshold) {
      // Scroll up
      autoScrollRef.current = setInterval(() => {
        container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed)
      }, 16)
    } else if (rect.bottom - clientY < scrollThreshold) {
      // Scroll down
      autoScrollRef.current = setInterval(() => {
        const maxScroll = container.scrollHeight - container.clientHeight
        container.scrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed)
      }, 16)
    }
  }, [])

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current)
      autoScrollRef.current = null
    }
  }, [])

  const handleDragStart = (e: React.DragEvent, headerId: string) => {
    setDraggedHeader(headerId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", headerId)
  }

  const handleDragOver = (e: React.DragEvent, headerId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverHeader(headerId)
    handleAutoScroll(e.clientY)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverHeader(null)
      stopAutoScroll()
    }
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    stopAutoScroll()

    const draggedId = e.dataTransfer.getData("text/plain")
    if (draggedId && draggedId !== targetId) {
      reorderHeaders(draggedId, targetId)
    }

    setDraggedHeader(null)
    setDragOverHeader(null)
  }

  const handleDragEnd = () => {
    stopAutoScroll()
    setDraggedHeader(null)
    setDragOverHeader(null)
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
    <div className="space-y-4" ref={containerRef}>
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
            <div
              key={header.id}
              className={`w-[75%] p-4 border rounded-lg space-y-3 bg-white shadow-sm transition-all duration-200 ${
                draggedHeader === header.id ? "opacity-50 scale-95" : ""
              } ${dragOverHeader === header.id ? "border-blue-500 bg-blue-50" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, header.id)}
              onDragOver={(e) => handleDragOver(e, header.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, header.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center space-x-2">
                <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Column name"
                  value={header.name}
                  draggable={false}
                  onChange={(e) => updateHeader(header.id, { name: e.target.value })}
                   onDragStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                  }}
                  onFocus={(e) => {
                    e.target.select()
                  }}
                  className="flex-1"
                />
                <Select value={header.type} onValueChange={(value) => updateHeader(header.id, { type: value })}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
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
                <FieldConfigDialog
                  field={header}
                  onSave={(updatedField) => updateHeader(header.id, updatedField as TableHeaderType)}
                />
                <Button size="sm" variant="destructive" onClick={() => deleteHeader(header.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
