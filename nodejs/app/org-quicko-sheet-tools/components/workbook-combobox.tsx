"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Workbook = {
  id: string
  name: string
}

type WorkbookComboboxProps = {
  workbooks: Workbook[]
  activeWorkbookId: string | null
  onSelect: (id: string) => void
}

export function WorkbookCombobox({ workbooks, activeWorkbookId, onSelect }: WorkbookComboboxProps) {
  const [open, setOpen] = useState(false)

  const activeWorkbook = workbooks.find((wb) => wb.id === activeWorkbookId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center min-w-0">
            <FileSpreadsheet className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
            <span className="truncate">{activeWorkbook ? activeWorkbook.name : "Select a workbook"}</span>
          </span>
          <ChevronsUpDown className="w-4 h-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search workbooks..." />
          <CommandList>
            <CommandEmpty>No workbooks found.</CommandEmpty>
            <CommandGroup>
              {workbooks.map((workbook) => (
                <CommandItem
                  key={workbook.id}
                  value={workbook.name}
                  onSelect={() => {
                    onSelect(workbook.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeWorkbookId === workbook.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{workbook.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
