import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  History,
  CreditCard,
  Calendar,
  ReceiptText,
  ChefHat,
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ClockIcon,
} from "lucide-react";
import { Bill } from "@/lib/restaurant-data";
import { cn } from "@/lib/utils";

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
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Helper function to get status badge color and icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULLY_PAID":
        return {
          label: "Fully Paid",
          icon: CheckCircle2,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "PARTIALLY_PAID":
        return {
          label: "Partial Payment",
          icon: AlertCircle,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "UNPAID":
        return {
          label: "Unpaid",
          icon: ClockIcon,
          className: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          label: status,
          icon: ReceiptText,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  if (isFetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <History className="h-5 w-5" /> Past Orders
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto mb-4 h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
              </div>
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
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <History className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Order History
            </span>
            {past && past.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-sm">
                {past.length} {past.length === 1 ? "Order" : "Orders"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
          {!past || past.length === 0 ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
              <div className="rounded-full bg-gray-100 p-6 mb-4">
                <ReceiptText className="h-16 w-16 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                When you complete orders, they will appear here for easy
                reference and tracking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {past.map((bill) => {
                const statusInfo = getStatusBadge(bill.status);
                const StatusIcon = statusInfo.icon;
                const hasMultiplePayments =
                  bill.SalePayments && bill.SalePayments.length > 1;
                const totalPaid =
                  bill.SalePayments?.reduce(
                    (sum, p) => sum + parseFloat(p.amount),
                    0,
                  ) || 0;

                return (
                  <Card
                    key={bill.id}
                    className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white"
                  >
                    {/* Header Section */}
                    <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-300" />
                              <span className="text-xl font-bold">
                                Table {bill.table?.number || bill.tableId}
                              </span>
                            </div>
                            <Badge
                              className={cn(
                                "gap-1 border-0 shadow-sm",
                                statusInfo.className,
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-300">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(bill.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <ChefHat className="h-3 w-3" />
                              {bill.items.length}{" "}
                              {bill.items.length === 1 ? "item" : "items"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="sm:text-lg md:lg:xl:text-2xl font-bold">
                            {formatCurrency(bill.total)}
                          </div>
                          {parseFloat(bill.balance) > 0 && (
                            <div className="text-xs text-gray-300">
                              Balance: {formatCurrency(bill.balance)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="border-b border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <ReceiptText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          Order Items
                        </span>
                      </div>
                      <div className="space-y-2">
                        {bill.items.map((item, idx) => (
                          <div
                            key={`${bill.id}-${item.menuItemId}-${idx}`}
                            className="flex items-center justify-between rounded-lg bg-white p-2 text-sm transition-colors hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="font-semibold text-gray-900 min-w-[40px]">
                                {item.quantity}×
                              </span>
                              <span className="text-gray-600 flex-1">
                                {item.name}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Section */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700">
                            Payment Details
                          </span>
                        </div>
                        {hasMultiplePayments && (
                          <Badge variant="outline" className="text-xs">
                            Multiple Transactions
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                        {bill.SalePayments && bill.SalePayments.length > 0 ? (
                          <>
                            {bill.SalePayments.map((payment, idx) => (
                              <div
                                key={payment.id || idx}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full bg-white p-1">
                                    <DollarSign className="h-3 w-3 text-green-600" />
                                  </div>
                                  <span className="text-gray-700">
                                    {payment.paymentMethod || "Unknown"}
                                  </span>
                                  {hasMultiplePayments && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      #{idx + 1}
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </div>
                            ))}

                            {/* Summary for multiple payments */}
                            {hasMultiplePayments && (
                              <>
                                <div className="border-t border-gray-200 my-2" />
                                <div className="flex items-center justify-between text-sm font-medium">
                                  <span className="text-gray-700">
                                    Total Paid
                                  </span>
                                  <span className="text-green-600">
                                    {formatCurrency(totalPaid)}
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Remaining balance */}
                            {parseFloat(bill.balance) > 0 && (
                              <div className="flex items-center justify-between text-sm font-medium pt-1">
                                <span className="text-gray-700">Remaining</span>
                                <span className="text-orange-600">
                                  {formatCurrency(bill.balance)}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>No payment records</span>
                            <span>{formatCurrency(0)}</span>
                          </div>
                        )}
                      </div>

                      {/* Order Notes */}
                      {bill.notes && bill.notes.trim() !== "" && (
                        <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <div className="text-xs font-medium text-blue-900 mb-1">
                                Order Notes
                              </div>
                              <p className="text-sm text-blue-800">
                                {bill.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer Meta */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Order #{bill.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              bill.saleStatus === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700",
                            )}
                          >
                            {bill.saleStatus || bill.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
