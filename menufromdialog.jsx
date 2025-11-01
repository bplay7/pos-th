import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MenuFormDialog({ open, onClose, item }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "อาหารจานหลัก",
    image_url: "",
    is_recommended: false,
    is_available: true
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        category: item.category || "อาหารจานหลัก",
        image_url: item.image_url || "",
        is_recommended: item.is_recommended || false,
        is_available: item.is_available !== false
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        category: "อาหารจานหลัก",
        image_url: "",
        is_recommended: false,
        is_available: true
      });
    }
  }, [item, open]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const docRef = await addDoc(collection(db, 'menuItems'), data);
      return { id: docRef.id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const menuItemRef = doc(db, 'menuItems', id);
      await updateDoc(menuItemRef, data);
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (item) {
      updateMutation.mutate({ id: item.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">ชื่อเมนู *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ผัดไทย"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="price">ราคา (฿) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">หมวดหมู่ *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="อาหารจานหลัก">อาหารจานหลัก</SelectItem>
                  <SelectItem value="ของทานเล่น">ของทานเล่น</SelectItem>
                  <SelectItem value="ของหวาน">ของหวาน</SelectItem>
                  <SelectItem value="เครื่องดื่ม">เครื่องดื่ม</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายรายละเอียดของเมนู"
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL รูปภาพ</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="mt-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recommended"
                  checked={formData.is_recommended}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recommended: checked })}
                />
                <Label htmlFor="is_recommended" className="cursor-pointer">
                  เมนูแนะนำ
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available" className="cursor-pointer">
                  พร้อมให้บริการ
                </Label>
              </div>
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