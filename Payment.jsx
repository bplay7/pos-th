import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Receipt, DollarSign, CheckCircle, Printer } from "lucide-react";
import { motion } from "framer-motion";

export default function Payment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tableId = urlParams.get('table_id');

  const [isPrinting, setIsPrinting] = useState(false);

  const { data: table } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => base44.entities.Table.list().then(tables => tables.find(t => t.id === tableId)),
    enabled: !!tableId,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', tableId],
    queryFn: () => base44.entities.Order.filter({ 
      table_id: tableId, 
      status: { $ne: "ชำระเงินแล้ว" } 
    }),
    enabled: !!tableId,
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Table.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['table', tableId]);
      queryClient.invalidateQueries(['tables']);
    },
  });

  const updateOrdersMutation = useMutation({
    mutationFn: async (orderIds) => {
      for (const orderId of orderIds) {
        await base44.entities.Order.update(orderId, { status: "ชำระเงินแล้ว" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', tableId]);
      updateTableMutation.mutate({
        id: tableId,
        data: { status: "ว่าง" }
      });
      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 1500);
    },
  });

  const getAllItems = () => {
    const allItems = [];
    orders.forEach(order => {
      order.items?.forEach(item => {
        const existing = allItems.find(i => i.menu_item_id === item.menu_item_id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          allItems.push({ ...item });
        }
      });
    });
    return allItems;
  };

  const getGrandTotal = () => {
    return orders.reduce((sum, order) => sum + (order.total || 0), 0);
  };

  const handlePrintBill = () => {
    setIsPrinting(true);
    
    // Create print content
    const printContent = `
      ==============================
      ร้านอาหารอร่อย
      ==============================
      โต๊ะ: ${table?.table_number}
      วันที่: ${new Date().toLocaleDateString('th-TH')}
      เวลา: ${new Date().toLocaleTimeString('th-TH')}
      ==============================
      รายการอาหาร
      ------------------------------
${getAllItems().map(item => `      ${item.name} x${item.quantity}
      ${item.price} x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} ฿`).join('\n')}
      ------------------------------
      ยอดรวมทั้งหมด: ${getGrandTotal().toFixed(2)} ฿
      ==============================
      ขอบคุณที่ใช้บริการ
      ==============================
    `;
    
    console.log(printContent);
    alert("พิมพ์บิลแล้ว (ดูใน Console)");
    
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handlePayment = () => {
    const orderIds = orders.map(order => order.id);
    updateOrdersMutation.mutate(orderIds);
  };

  if (!table) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const allItems = getAllItems();
  const grandTotal = getGrandTotal();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">คิดเงิน</h1>
            <p className="text-gray-500">โต๊ะ {table.table_number}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีรายการสั่ง</h3>
              <p className="text-gray-600 mb-6">โต๊ะนี้ยังไม่มีการสั่งอาหาร</p>
              <Button
                onClick={() => navigate(createPageUrl("Home"))}
                variant="outline"
              >
                กลับหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    รายการอาหาร
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {allItems.map((item, index) => (
                      <motion.div
                        key={item.menu_item_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex justify-between items-start py-3 border-b last:border-0">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">
                              {item.price.toFixed(2)} ฿ × {item.quantity}
                            </p>
                            {item.note && (
                              <p className="text-sm text-orange-600 mt-1">
                                หมายเหตุ: {item.note}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">
                              {(item.price * item.quantity).toFixed(2)} ฿
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order History */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base">ประวัติการสั่ง ({orders.length} ครั้ง)</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {orders.map((order, index) => (
                      <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                        <div>
                          <span className="text-gray-600">ครั้งที่ {index + 1}</span>
                          <Badge className="ml-2 text-xs" variant="outline">
                            {order.status}
                          </Badge>
                        </div>
                        <span className="font-semibold">{order.total?.toFixed(2)} ฿</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    สรุปยอด
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-gray-600">
                      <span>จำนวนรายการ</span>
                      <span className="font-semibold">{allItems.reduce((sum, item) => sum + item.quantity, 0)} รายการ</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-600">
                      <span>ยอดรวม</span>
                      <span className="font-semibold">{grandTotal.toFixed(2)} ฿</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">ยอดชำระทั้งหมด</span>
                      <span className="text-3xl font-bold text-orange-600">
                        {grandTotal.toFixed(2)} ฿
                      </span>
                    </div>

                    <Separator />

                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={handlePrintBill}
                        variant="outline"
                        className="w-full"
                        disabled={isPrinting}
                      >
                        <Printer className="w-5 h-5 mr-2" />
                        {isPrinting ? "กำลังพิมพ์..." : "พิมพ์บิล"}
                      </Button>

                      <Button
                        onClick={handlePayment}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg shadow-lg"
                        disabled={updateOrdersMutation.isPending}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {updateOrdersMutation.isPending ? "กำลังชำระเงิน..." : "ชำระเงิน"}
                      </Button>
                    </div>

                    {updateOrdersMutation.isSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
                      >
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-green-800 font-semibold">ชำระเงินสำเร็จ!</p>
                        <p className="text-sm text-green-600">กำลังกลับหน้าหลัก...</p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Table Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>หมายเลขโต๊ะ</span>
                      <span className="font-semibold">{table.table_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>จำนวนที่นั่ง</span>
                      <span className="font-semibold">{table.seats} ที่นั่ง</span>
                    </div>
                    <div className="flex justify-between">
                      <span>สถานะ</span>
                      <Badge className={
                        table.status === "ว่าง" ? "bg-green-100 text-green-700" :
                        table.status === "มีลูกค้า" ? "bg-blue-100 text-blue-700" :
                        "bg-orange-100 text-orange-700"
                      }>
                        {table.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}