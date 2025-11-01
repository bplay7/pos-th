
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, ShoppingCart, Trash2, Check, Search, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TableOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tableId = urlParams.get('table_id');

  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: table } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => base44.entities.Table.list().then(tables => tables.find(t => t.id === tableId)),
    enabled: !!tableId,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: existingOrders = [] } = useQuery({
    queryKey: ['orders', tableId],
    queryFn: () => base44.entities.Order.filter({ table_id: tableId, status: { $ne: "ชำระเงินแล้ว" } }),
    enabled: !!tableId,
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Table.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['table', tableId]);
      queryClient.invalidateQueries(['tables']);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.Order.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders', tableId]);
      setCart([]);
      if (table?.status === "ว่าง") {
        updateTableMutation.mutate({
          id: tableId,
          data: { status: "มีลูกค้า" }
        });
      }
    },
  });

  const categories = ["ทั้งหมด", "อาหารจานหลัก", "ของทานเล่น", "ของหวาน", "เครื่องดื่ม"];

  const filteredItems = menuItems
    .filter(item => item.is_available)
    .filter(item => selectedCategory === "ทั้งหมด" || item.category === selectedCategory)
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.menu_item_id === item.id);
    if (existingItem) {
      setCart(cart.map(i =>
        i.menu_item_id === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        note: ""
      }]);
    }
  };

  const removeFromCart = (menuItemId) => {
    setCart(cart.filter(i => i.menu_item_id !== menuItemId));
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart(cart.map(i => {
      if (i.menu_item_id === menuItemId) {
        const newQuantity = i.quantity + delta;
        return newQuantity > 0 ? { ...i, quantity: newQuantity } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = () => {
    if (cart.length === 0) return;

    const orderData = {
      table_id: tableId,
      table_number: table?.table_number,
      items: cart,
      total: getCartTotal(),
      status: "รอทำ"
    };

    createOrderMutation.mutate(orderData);
  };

  const handleGoToPayment = () => {
    navigate(createPageUrl("Payment") + `?table_id=${tableId}`);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Menu Section */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">โต๊ะ {table.table_number}</h1>
              <Badge className={`${
                table.status === "ว่าง" ? "bg-green-100 text-green-700" :
                table.status === "มีลูกค้า" ? "bg-blue-100 text-blue-700" :
                "bg-orange-100 text-orange-700"
              } border-0`}>
                {table.status}
              </Badge>
            </div>
            <div className="flex gap-2 items-center"> {/* Added items-center for vertical alignment */}
              {existingOrders.length > 0 && (
                <Button
                  onClick={handleGoToPayment}
                  className="bg-green-600 hover:bg-green-700 h-9" // Changed size to h-9 to match other buttons in header
                  size="sm"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">คิดเงิน</span>
                </Button>
              )}
              <div className="text-right">
                <div className="text-sm text-gray-500">รอบนี้</div>
                <div className="text-xl font-bold text-orange-600">{getCartTotal().toFixed(2)} ฿</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full flex flex-wrap justify-start bg-gray-100 p-1 rounded-lg overflow-x-auto">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white px-4 py-2 rounded-md text-sm whitespace-nowrap"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Menu Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="wait">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-300"
                    onClick={() => addToCart(item)}
                  >
                    <CardContent className="p-0">
                      <div className="relative h-32 overflow-hidden rounded-t-lg">
                        <img
                          src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.is_recommended && (
                          <Badge className="absolute top-2 right-2 bg-orange-500 text-white border-0 text-xs">
                            แนะนำ
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-orange-600">{item.price} ฿</span>
                          <Plus className="w-5 h-5 text-orange-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cart Section - Desktop Sidebar */}
      <div className="lg:w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">รายการสั่ง ({cart.length})</h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length > 0 ? (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.menu_item_id} className="border-2">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-orange-600 font-semibold">{item.price} ฿</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 -mt-1 -mr-1"
                        onClick={() => removeFromCart(item.menu_item_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.menu_item_id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-bold text-lg w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.menu_item_id, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <span className="ml-auto font-bold text-orange-600">
                        {(item.price * item.quantity).toFixed(2)} ฿
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ยังไม่มีรายการสั่ง</p>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold">ยอดรวม</span>
              <span className="text-2xl font-bold text-orange-600">
                {getCartTotal().toFixed(2)} ฿
              </span>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={createOrderMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg shadow-lg"
            >
              <Check className="w-5 h-5 mr-2" />
              {createOrderMutation.isPending ? "กำลังบันทึก..." : "ยืนยันออร์เดอร์"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
