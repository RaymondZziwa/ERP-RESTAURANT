import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CreditCard, User, Calendar, ReceiptText } from "lucide-react";
import { Bill } from "@/lib/restaurant-data";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pastBills: Bill[] | null;
  isFetching: boolean;
}

export function PastOrdersDialog({
  open,
  onOpenChange,
  pastBills: past,
  isFetching,
}: Props) {
  // Helper function to format currency
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `UGX ${numAmount.toLocaleString()}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULLY_PAID":
        return { label: "Paid", className: "bg-green-100 text-green-800" };
      case "PARTIALLY_PAID":
        return { label: "Partial", className: "bg-yellow-100 text-yellow-800" };
      case "UNPAID":
        return { label: "Unpaid", className: "bg-red-100 text-red-800" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  // Helper function to get payment method display
  const getPaymentMethodDisplay = (paymentMethod: string | null) => {
    if (paymentMethod) return paymentMethod;
    return "Not specified";
  };

  if (isFetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Past Orders
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Loading past orders...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Past Orders
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {!past || past.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <ReceiptText className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No past orders found.
              </p>
            </div>
          ) : (
            past.map((bill) => {
              const statusInfo = getStatusBadge(bill.status);
              const hasMultiplePayments =
                bill.SalePayments && bill.SalePayments.length > 1;

              return (
                <Card
                  key={bill.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-gray-50 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">
                            Table {bill.table?.number || bill.tableId}
                          </span>
                          <Badge className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(bill.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(bill.total)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Balance: {formatCurrency(bill.balance)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-3">
                    <div className="text-sm font-medium mb-2">Order Items</div>
                    <ul className="space-y-1.5">
                      {bill.items.map((item, idx) => (
                        <li
                          key={`${bill.id}-${item.menuItemId}-${idx}`}
                          className="flex justify-between text-sm"
                        >
                          <div className="flex-1">
                            <span className="font-medium">
                              {item.quantity}×
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {item.name}
                            </span>
                          </div>
                          <div className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-gray-50 p-3 border-t">
                    <div className="text-sm font-medium mb-2">
                      Payment Details
                    </div>
                    <div className="space-y-1">
                      {bill.SalePayments && bill.SalePayments.length > 0 ? (
                        bill.SalePayments.map((payment, idx) => (
                          <div
                            key={payment.id || idx}
                            className="flex justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <span>{payment.paymentMethod || "Unknown"}</span>
                              {idx === 0 && hasMultiplePayments && (
                                <Badge variant="outline" className="text-xs">
                                  {idx + 1}/{bill?.SalePayments.length}
                                </Badge>
                              )}
                            </div>
                            <div className="font-medium">
                              {formatCurrency(payment.amount)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>No payment records</span>
                          <span>{formatCurrency(0)}</span>
                        </div>
                      )}

                      {/* Show total paid if multiple payments */}
                      {hasMultiplePayments && (
                        <div className="flex justify-between text-sm font-medium pt-1 border-t mt-1">
                          <span>Total Paid</span>
                          <span>
                            {formatCurrency(
                              bill.SalePayments.reduce(
                                (sum, p) => sum + parseFloat(p.amount),
                                0,
                              ),
                            )}
                          </span>
                        </div>
                      )}

                      {/* Show remaining balance if not fully paid */}
                      {parseFloat(bill.balance) > 0 && (
                        <div className="flex justify-between text-sm text-orange-600 font-medium">
                          <span>Remaining Balance</span>
                          <span>{formatCurrency(bill.balance)}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Notes */}
                    {bill.notes && bill.notes.trim() !== "" && (
                      <div className="mt-2 pt-2 border-t text-sm">
                        <div className="text-xs text-muted-foreground mb-1">
                          Notes:
                        </div>
                        <p className="text-sm italic text-gray-600">
                          {bill.notes}
                        </p>
                      </div>
                    )}

                    {/* Order Status */}
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Order ID: #{bill.id}</span>
                      <span>Status: {bill.saleStatus || bill.status}</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
