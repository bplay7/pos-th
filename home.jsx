import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Edit, Trash2, DollarSign, ShoppingCart, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TableFormDialog from "../components/tables/TableFormDialog";
import DeleteConfirmDialog from "../components/tables/DeleteConfirmDialog";

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => base44.entities.Table.list('table_number'),
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id) => base44.entities.Table.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
      setDeletingTable(null);
    },
  });

  const handleTableClick = (table) => {
    navigate(createPageUrl("TableOrder") + `?table_id=${table.id}`);
  };

  const handlePaymentClick = (table, e) => {
    e.stopPropagation();
    navigate(createPageUrl("Payment") + `?table_id=${table.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ว่าง":
        return "bg-green-100 text-green-700 border-green-200";
      case "มีลูกค้า":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "รอชำระเงิน":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">โต๊ะทั้งหมด</h1>
            <p className="text-gray-500 mt-1">เลือกโต๊ะเพื่อเริ่มรับออร์เดอร์</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 shadow-lg"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">เพิ่มโต๊ะ</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {tables.filter(t => t.status === "ว่าง").length}
              </div>
              <div className="text-sm text-gray-500">โต๊ะว่าง</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tables.filter(t => t.status === "มีลูกค้า").length}
              </div>
              <div className="text-sm text-gray-500">มีลูกค้า</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tables.filter(t => t.status === "รอชำระเงิน").length}
              </div>
              <div className="text-sm text-gray-500">รอชำระ</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="p-4 md:p-8">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tables.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {tables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group border-2">
                    <CardContent className="p-0">
                      {/* Main Card - Clickable */}
                      <div
                        onClick={() => handleTableClick(table)}
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-white">
                              {table.table_number}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-2">
                            โต๊ะ {table.table_number}
                          </h3>
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
                            <Users className="w-4 h-4" />
                            <span>{table.seats} ที่นั่ง</span>
                          </div>
                          <Badge className={`${getStatusColor(table.status)} border font-medium`}>
                            {table.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-gray-100 bg-gray-50 p-2">
                        {table.status !== "ว่าง" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => handlePaymentClick(table, e)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              คิดเงิน
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50 hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTableClick(table);
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              สั่งเพิ่ม
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full hover:bg-blue-50 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableClick(table);
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            เริ่มสั่ง
                          </Button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-blue-50 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTable(table);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            แก้ไข
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTable(table);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            ลบ
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีโต๊ะ</h3>
            <p className="text-gray-600 mb-6">เริ่มต้นด้วยการเพิ่มโต๊ะของร้านคุณ</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              เพิ่มโต๊ะแรก
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TableFormDialog
        open={showAddDialog || !!editingTable}
        onClose={() => {
          setShowAddDialog(false);
          setEditingTable(null);
        }}
        table={editingTable}
      />

      <DeleteConfirmDialog
        open={!!deletingTable}
        onClose={() => setDeletingTable(null)}
        onConfirm={() => deleteTableMutation.mutate(deletingTable.id)}
        tableName={deletingTable?.table_number}
        isDeleting={deleteTableMutation.isPending}
      />
    </div>
  );
}