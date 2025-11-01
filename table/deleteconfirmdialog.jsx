import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DeleteConfirmDialog({ open, onClose, onConfirm, itemName, isDeleting }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>ยืนยันการลบเมนู</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            คุณแน่ใจหรือไม่ที่จะลบเมนู <strong>{itemName}</strong>?
            <br />
            <span className="text-red-600">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "กำลังลบ..." : "ลบเมนู"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}