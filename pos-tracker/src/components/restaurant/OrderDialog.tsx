import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, NotebookPen } from "lucide-react";
import { type OrderItem, calcTotals } from "@/lib/restaurant-data";
import { useRestaurant } from "@/lib/restaurant-store";
import useItemCategories from "@/hooks/inventory/useItemCategories";
import useItems from "@/hooks/inventory/useItems";
import { apiRequest } from "@/lib/api/apiConfig";
import { MEALSALEENDPOINTS } from "@/endpoints/sales/mealSaleEndpoints";
import { toast } from "sonner";
import useTables from "@/hooks/sales/useTables";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tableId: number;
  existingBillId?: string;
  refreshPendingBills: () => void;
  selectedTableId: number | null;
}

export function OrderDialog({
  open,
  onOpenChange,
  tableId,
  existingBillId,
  refreshPendingBills,
  selectedTableId
}: Props) {
  const { data: categories = [] } = useItemCategories();
  const { data: dishes = [] } = useItems();
  const { addToBill, getBill } = useRestaurant();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const existingBill = getBill(existingBillId);
  const { refresh } = useTables();

  // Get user from localStorage safely
  const getUser = () => {
    try {
      const persistData = localStorage.getItem("persist:userAuth");
      if (!persistData) return null;
      const parsed = JSON.parse(persistData);
      const userData = parsed?.data;
      if (typeof userData === "string") {
        return JSON.parse(userData);
      }
      return userData;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const user = getUser();

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setItems([]);
      setNotes("");
    }
    onOpenChange(open);
  };

  const add = (id: string) => {
    const menuItem = dishes.find((m) => m.id === id);
    if (!menuItem) return;

    setItems((prev) => {
      const existing = prev.find((p) => p.menuItemId === id);
      if (existing) {
        return prev.map((p) =>
          p.menuItemId === id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [
        ...prev,
        {
          menuItemId: id,
          name: menuItem.name,
          price: Number(menuItem.price),
          quantity: 1,
        },
      ];
    });
  };

  const dec = (id: string) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.menuItemId === id ? { ...p, quantity: p.quantity - 1 } : p,
        )
        .filter((p) => p.quantity > 0),
    );
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.menuItemId !== id));
  };

  const totals = useMemo(() => calcTotals(items), [items]);

  const placeOrder = async (
    tableId: number,
    items: OrderItem[],
    notes: string,
  ) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return false;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item to the order");
      return false;
    }

    if (isSubmitting) return false;
    setIsSubmitting(true);

    const payload = {
      tableId: selectedTableId || tableId,
      items: items.map((item) => ({
        name: item.name,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      })),
      servedBy: user.id,
      notes: notes.trim() || "",
      total: totals.total,
    };

    console.log("Placing order with payload:", payload);

    try {
      const response = await apiRequest(
        MEALSALEENDPOINTS.RECORD_ORDER.complete_sale,
        "POST",
        "",
        payload,
      );
      console.log("API response:", response);
      toast.success("Order placed successfully!");
      refresh();
      refreshPendingBills();
      setItems([]);
      setNotes("");
      onOpenChange(false);
      return true;
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error?.response?.data?.message || "Failed to place order");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearOrder = () => {
    setItems([]);
    setNotes("");
  };

  // Get the first category ID or fallback
  const defaultTab = categories.length > 0 ? categories[0].id : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="h-screen w-screen max-w-screen p-0 sm:h-[98vh] sm:w-[98vw] sm:max-w-[98vw] sm:rounded-lg">
        <DialogHeader className="border-b p-4">
          <DialogTitle>
            Table {tableId} {existingBill ? "— Add to Order" : "— New Order"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Menu Section */}
          <div className="min-h-0 flex-1 overflow-hidden p-4 lg:p-6">
            {categories.length > 0 && (
              <Tabs defaultValue={defaultTab} className="flex h-full flex-col">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                  {categories.map((c) => (
                    <TabsTrigger key={c.id} value={c.id} className="text-sm">
                      {c.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((c) => (
                  <TabsContent
                    key={c.id}
                    value={c.id}
                    className="mt-4 flex-1 overflow-y-auto"
                  >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {dishes
                        .filter((m) => m.categoryId === c.id)
                        .map((m) => (
                          <Card
                            key={m.id}
                            className="cursor-pointer p-4 transition-all hover:border-primary hover:shadow-md active:scale-95"
                            onClick={() => add(m.id)}
                          >
                            <div className="text-base font-medium">{m.name}</div>
                            <div className="text-sm text-muted-foreground">
                              UGX {Number(m.price).toLocaleString()}
                            </div>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
            {categories.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Loading menu...</p>
              </div>
            )}
          </div>

          {/* Order Summary Section - Fixed width on desktop */}
          <div className="flex max-h-[40vh] min-h-0 flex-col border-t bg-muted/30 lg:max-h-none lg:w-96 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-lg font-semibold">Current Order</span>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearOrder}
                  className="text-sm text-destructive"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Order Items List */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    No items added yet
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((it) => (
                    <li
                      key={it.menuItemId}
                      className="flex items-center gap-3 rounded-lg bg-background p-3 text-sm animate-in fade-in slide-in-from-right-2 shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">
                          UGX {it.price.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => dec(it.menuItemId)}
                          disabled={isSubmitting}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {it.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => add(it.menuItemId)}
                          disabled={isSubmitting}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => remove(it.menuItemId)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notes Input Section */}
            <div className="border-t p-4">
              <Label
                htmlFor="order-notes"
                className="mb-2 flex items-center gap-1 text-sm font-medium"
              >
                <NotebookPen className="h-4 w-4" />
                Order Notes (Optional)
              </Label>
              <Textarea
                id="order-notes"
                placeholder="Special requests, cooking instructions, allergies, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* Totals Section */}
            <div className="space-y-2 border-t p-4 text-base">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>UGX {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (7%)</span>
                <span>UGX {totals.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span>UGX {totals.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 border-t p-4">
          {existingBill && (
            <Badge variant="secondary" className="mr-auto self-center text-sm">
              Existing bill: UGX{" "}
              {existingBill.total?.toLocaleString() || "0.00"}
            </Badge>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            {existingBill ? (
              <Button
                onClick={() => addToBill(existingBill.id, items)}
                disabled={items.length === 0 || isSubmitting}
                className="px-6"
              >
                {isSubmitting ? "Adding..." : "Add to Existing Order"}
              </Button>
            ) : (
              <Button
                onClick={() => placeOrder(tableId, items, notes)}
                disabled={items.length === 0 || isSubmitting}
                className="px-6"
              >
                {isSubmitting ? "Placing Order..." : "Place Order"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}