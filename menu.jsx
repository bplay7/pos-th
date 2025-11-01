import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MenuFormDialog from "../components/menu/MenuFormDialog";
import DeleteConfirmDialog from "../components/menu/DeleteConfirmDialog";

export default function Menu() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, 'menuItems'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id) => {
      await deleteDoc(doc(db, 'menuItems', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      setDeletingItem(null);
    },
  });

  const categories = ["ทั้งหมด", "อาหารจานหลัก", "ของทานเล่น", "ของหวาน", "เครื่องดื่ม"];

  const filteredItems = selectedCategory === "ทั้งหมด"
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการเมนู</h1>
            <p className="text-gray-500 mt-1">เพิ่ม แก้ไข หรือลบเมนูอาหาร</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 shadow-lg"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">เพิ่มเมนู</span>
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full md:w-auto flex flex-wrap justify-start bg-gray-100 p-2 rounded-lg">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white px-4 py-2 rounded-lg text-sm"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Grid */}
      <div className="p-4 md:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.is_recommended && (
                        <Badge className="absolute top-2 right-2 bg-orange-500 text-white border-0">
                          <Star className="w-3 h-3 mr-1" />
                          แนะนำ
                        </Badge>
                      )}
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="destructive" className="text-base px-4 py-2">
                            หมด
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                        <Badge variant="outline" className="text-xs whitespace-nowrap ml-2">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description || "ไม่มีรายละเอียด"}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xl font-bold text-orange-600">
                          {item.price} ฿
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          แก้ไข
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          onClick={() => setDeletingItem(item)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          ลบ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีเมนูในหมวดนี้</h3>
            <p className="text-gray-600 mb-6">เริ่มต้นด้วยการเพิ่มเมนูอาหารของคุณ</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              เพิ่มเมนูแรก
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <MenuFormDialog
        open={showAddDialog || !!editingItem}
        onClose={() => {
          setShowAddDialog(false);
          setEditingItem(null);
        }}
        item={editingItem}
      />

      <DeleteConfirmDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => deleteItemMutation.mutate(deletingItem.id)}
        itemName={deletingItem?.name}
        isDeleting={deleteItemMutation.isPending}
      />
    </div>
  );
}