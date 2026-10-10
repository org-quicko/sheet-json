"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldConfigDialog } from "./field-config-dialog"
import type { ListBlock, KeyValuePair } from "@/types/schema"

interface ListBlockComponentProps {
  block: ListBlock
  onUpdate: (block: ListBlock) => void
  onDelete: () => void
}

export function ListBlockComponent({ block, onUpdate, onDelete }: ListBlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(block.name)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  const addItem = () => {
    const newItem: KeyValuePair = {
      id: Date.now().toString(),
      key: "",
      value: "",
      type: "string",
      nullAllowed: false,
    }
    onUpdate({
      ...block,
      items: [...block.items, newItem],
    })
  }

  const updateItem = (itemId: string, updates: Partial<KeyValuePair>) => {
    onUpdate({
      ...block,
      items: block.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    })
  }

  const deleteItem = (itemId: string) => {
    onUpdate({
      ...block,
      items: block.items.filter((item) => item.id !== itemId),
    })
  }

  const reorderItems = (draggedId: string, targetId: string) => {
    const draggedIndex = block.items.findIndex((item) => item.id === draggedId)
    const targetIndex = block.items.findIndex((item) => item.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newItems = [...block.items]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItem)

    onUpdate({
      ...block,
      items: newItems,
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

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", itemId)
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverItem(itemId)
    handleAutoScroll(e.clientY)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
      stopAutoScroll()
    }
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    stopAutoScroll()

    const draggedId = e.dataTransfer.getData("text/plain")
    if (draggedId && draggedId !== targetId) {
      reorderItems(draggedId, targetId)
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    stopAutoScroll()
    setDraggedItem(null)
    setDragOverItem(null)
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
      {/* Fields */}
      <div className="space-y-3">
        {block.items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">No fields defined yet</p>
            <Button onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Field
            </Button>
          </div>
        ) : (
          block.items.map((item) => (
            <div
              key={item.id}
              className={`w-[75%] p-4 border rounded-lg space-y-3 bg-white shadow-sm transition-all duration-200 ${
                draggedItem === item.id ? "opacity-50 scale-95" : ""
              } ${dragOverItem === item.id ? "border-blue-500 bg-blue-50" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center space-x-2">
                <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Field name"
                  value={item.key}
                  onChange={(e) => updateItem(item.id, { key: e.target.value })}
                  className="flex-1"
                />
                <Select value={item.type} onValueChange={(value) => updateItem(item.id, { type: value as "string" | "number" | "boolean" | "object" | "integer" | "array" | undefined })}>
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
                  field={item}
                  onSave={(updatedField) => updateItem(item.id, updatedField as KeyValuePair)}
                />
                <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
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
