import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api/apiConfig";
import { MEALSALEENDPOINTS } from "@/endpoints/sales/mealSaleEndpoints";
import { toast } from "sonner";
import type { Bill } from "@/lib/restaurant-data";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (bill: Bill) => void;
  setNumberOfPendingBills: (n: number) => void;
  pendingBills: Bill[];
  isLoading: boolean;
}

export function PendingBillsDialog({
  open,
  onOpenChange,
  onSelect,
  setNumberOfPendingBills,
  pendingBills,
  isLoading,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pending Bills</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading pending bills...
              </span>
            </div>
          )}

          {!isLoading && pendingBills.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No pending bills found.
            </p>
          )}

          {!isLoading &&
            pendingBills.map((bill) => (
              <Card
                key={bill.id}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
                onClick={() => {
                  onSelect(bill);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-semibold">
                      Table {bill.tableNumber || bill.tableId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bill.items?.reduce((s, i) => s + i.quantity, 0) || 0}{" "}
                      items
                    </div>
                    {bill.createdAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(bill.createdAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-base">
                    UGX {(bill.total || 0).toLocaleString()}
                  </Badge>
                </div>
              </Card>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
