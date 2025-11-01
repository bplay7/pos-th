import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TableFormDialog({ open, onClose, table }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    table_number: "",
    seats: 4,
    status: "ว่าง"
  });

  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number || "",
        seats: table.seats || 4,
        status: table.status || "ว่าง"
      });
    } else {
      setFormData({
        table_number: "",
        seats: 4,
        status: "ว่าง"
      });
    }
  }, [table]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Table.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Table.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (table) {
      updateMutation.mutate({ id: table.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {table ? "แก้ไขโต๊ะ" : "เพิ่มโต๊ะใหม่"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="table_number">หมายเลขโต๊ะ *</Label>
              <Input
                id="table_number"
                required
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                placeholder="เช่น 1, A1, VIP-1"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="seats">จำนวนที่นั่ง</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="20"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="status">สถานะ</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ว่าง">ว่าง</SelectItem>
                  <SelectItem value="มีลูกค้า">มีลูกค้า</SelectItem>
                  <SelectItem value="รอชำระเงิน">รอชำระเงิน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
