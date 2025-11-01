import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Calendar, DollarSign, Receipt, TrendingUp, Wallet, CreditCard, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { th } from "date-fns/locale";

export default function Sales() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState("summary");

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.filter({ status: "ชำระเงินแล้ว" }),
  });

  // Filter orders by selected date
  const filteredOrders = allOrders.filter(order => {
    if (!order.paid_date) return false;
    const orderDate = format(parseISO(order.paid_date), 'yyyy-MM-dd');
    return orderDate === selectedDate;
  });

  // Calculate statistics
  const getTotalSales = () => {
    return filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  };

  const getOrderCount = () => {
    return filteredOrders.length;
  };

  const getPaymentMethodStats = () => {
    const cash = filteredOrders.filter(o => o.payment_method === "เงินสด").reduce((sum, o) => sum + (o.total || 0), 0);
    const transfer = filteredOrders.filter(o => o.payment_method === "โอน").reduce((sum, o) => sum + (o.total || 0), 0);
    return { cash, transfer };
  };

  const getTopSellingItems = () => {
    const itemStats = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!itemStats[item.name]) {
          itemStats[item.name] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        itemStats[item.name].quantity += item.quantity;
        itemStats[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.values(itemStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  };

  const getHourlySales = () => {
    const hourly = Array(24).fill(0).map((_, i) => ({ hour: i, amount: 0, count: 0 }));
    filteredOrders.forEach(order => {
      if (order.paid_date) {
        const hour = new Date(order.paid_date).getHours();
        hourly[hour].amount += order.total || 0;
        hourly[hour].count += 1;
      }
    });
    return hourly.filter(h => h.count > 0);
  };

  const paymentStats = getPaymentMethodStats();
  const topItems = getTopSellingItems();
  const hourlySales = getHourlySales();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart className="w-8 h-8 text-orange-500" />
              รายงานยอดขาย
            </h1>
            <p className="text-gray-500 mt-1">สรุปยอดขายและรายได้</p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="w-48"
            />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">ยอดขายรวม</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {getTotalSales().toFixed(2)} ฿
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: th })}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">จำนวนออร์เดอร์</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {getOrderCount()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">ออร์เดอร์ทั้งหมด</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">เงินสด</p>
                        <p className="text-3xl font-bold text-green-600">
                          {paymentStats.cash.toFixed(2)} ฿
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {filteredOrders.filter(o => o.payment_method === "เงินสด").length} ออร์เดอร์
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">โอนเงิน</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {paymentStats.transfer.toFixed(2)} ฿
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {filteredOrders.filter(o => o.payment_method === "โอน").length} ออร์เดอร์
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="summary">สรุปรายการ</TabsTrigger>
                <TabsTrigger value="topselling">เมนูขายดี</TabsTrigger>
                <TabsTrigger value="hourly">ยอดขายรายชั่วโมง</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      รายการออร์เดอร์ทั้งหมด ({filteredOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {filteredOrders.length > 0 ? (
                      <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <Card className="border-2 hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-gray-900">โต๊ะ {order.table_number}</h3>
                                      <Badge className={
                                        order.payment_method === "เงินสด" 
                                          ? "bg-green-100 text-green-700"
                                          : "bg-purple-100 text-purple-700"
                                      }>
                                        {order.payment_method}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      {order.paid_date && format(parseISO(order.paid_date), 'HH:mm น.', { locale: th })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-orange-600">
                                      {order.total?.toFixed(2)} ฿
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {order.items?.reduce((sum, item) => sum + item.quantity, 0)} รายการ
                                    </p>
                                  </div>
                                </div>
                                <div className="border-t pt-3 space-y-1">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        {item.name} x{item.quantity}
                                      </span>
                                      <span className="text-gray-900 font-semibold">
                                        {(item.price * item.quantity).toFixed(2)} ฿
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีข้อมูลยอดขาย</h3>
                        <p className="text-gray-600">ยังไม่มีการชำระเงินในวันที่เลือก</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topselling">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      เมนูขายดีประจำวัน
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {topItems.length > 0 ? (
                      <div className="space-y-4">
                        {topItems.map((item, index) => (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                                #{index + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{item.name}</h3>
                                <p className="text-sm text-gray-500">ขายได้ {item.quantity} รายการ</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-green-600">
                                  {item.revenue.toFixed(2)} ฿
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">ยังไม่มีข้อมูลการขาย</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hourly">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-100 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="w-5 h-5" />
                      ยอดขายรายชั่วโมง
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {hourlySales.length > 0 ? (
                      <div className="space-y-3">
                        {hourlySales.map((hour) => {
                          const maxAmount = Math.max(...hourlySales.map(h => h.amount));
                          const percentage = (hour.amount / maxAmount) * 100;
                          
                          return (
                            <motion.div
                              key={hour.hour}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-semibold text-gray-700">
                                    {hour.hour.toString().padStart(2, '0')}:00 - {(hour.hour + 1).toString().padStart(2, '0')}:00
                                  </span>
                                  <span className="text-gray-600">
                                    {hour.amount.toFixed(2)} ฿ ({hour.count} ออร์เดอร์)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">ยังไม่มีข้อมูลยอดขาย</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}