"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type OverwriteWorkbookDialogProps = {
  open: boolean
  workbookName: string
  onConfirm: () => void
  onCancel: () => void
}

export function OverwriteWorkbookDialog({ open, workbookName, onConfirm, onCancel }: OverwriteWorkbookDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Overwrite existing workbook?</DialogTitle>
          <DialogDescription>
            A workbook named &quot;{workbookName}&quot; already exists. Importing this workbook will overwrite the
            existing one. Do you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Overwrite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
