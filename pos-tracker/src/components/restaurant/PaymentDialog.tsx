import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Receipt, Banknote, Smartphone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRestaurant } from "@/lib/restaurant-store";
import type { Bill } from "@/lib/restaurant-data";
import { apiRequest } from "@/lib/api/apiConfig";
import { MEALSALEENDPOINTS } from "@/endpoints/sales/mealSaleEndpoints";
import { toast } from "sonner";
import useTables from "@/hooks/sales/useTables";
import PaymentWaitingModal from "./paymentWaitingModal";

interface Props {
  bill: Bill | null;
  onClose: () => void;
  onSuccess?: () => void;
  refreshPendingBills?: () => void;
}

export function PaymentDialog({
  bill,
  onClose,
  onSuccess,
  refreshPendingBills,
}: Props) {
  const { payBill } = useRestaurant();
  const { refresh } = useTables();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "CASH" | "MOBILE_MONEY"
  >("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Waiting modal state
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const calculateSubtotal = () => {
    if (!bill) return 0;
    return bill.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.07;
  };

  const calculateTotal = (subtotal: number, tax: number) => {
    return subtotal + tax;
  };

  const formatPhoneNumber = (number: string) => {
    if (!number) return "";
    const cleanNumber = number.replace(/\D/g, "");

    if (cleanNumber.startsWith("0") && cleanNumber.length === 10) {
      return "+256" + cleanNumber.substring(1);
    }

    if (cleanNumber.startsWith("256") && cleanNumber.length === 12) {
      return "+" + cleanNumber;
    }

    if (number.startsWith("+256")) {
      return number;
    }

    if (cleanNumber.length === 9) {
      return "+256" + cleanNumber;
    }

    return number;
  };

  const validatePhoneNumber = (number: string): boolean => {
    if (selectedPaymentMethod !== "MOBILE_MONEY") return true;

    if (!number.trim()) {
      setPhoneError("Phone number is required for mobile money payments");
      return false;
    }

    const formattedNumber = formatPhoneNumber(number);
    if (!formattedNumber.startsWith("+256") || formattedNumber.length !== 13) {
      setPhoneError(
        "Please enter a valid phone number (e.g., 07xx... or +256xxx...)",
      );
      return false;
    }

    setPhoneError("");
    return true;
  };

  useEffect(() => {
    if (selectedPaymentMethod !== "MOBILE_MONEY") {
      setPhoneError("");
    }
  }, [selectedPaymentMethod]);

  // Handle successful payment completion
  const handlePaymentComplete = () => {
    setShowWaitingModal(false);
    setPaymentReference(null);

    // Update local state
    if (bill) {
      payBill(bill.id);
    }
    refresh();
    refreshPendingBills?.();

    onSuccess?.();
    onClose();
  };

  // Handle payment failure
  const handlePaymentFailed = () => {
    setShowWaitingModal(false);
    setPaymentReference(null);
    setIsProcessing(false);
    // Don't close the payment dialog - let user try again
  };

  const processPayment = async () => {
    if (selectedPaymentMethod === "MOBILE_MONEY") {
      if (!validatePhoneNumber(phoneNumber)) {
        toast.error(phoneError);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const payload: any = {
        saleId: bill?.id,
        paymentMethod: selectedPaymentMethod,
        amountPaid: calculateTotal(
          calculateSubtotal(),
          calculateTax(calculateSubtotal()),
        ),
      };

      if (selectedPaymentMethod === "MOBILE_MONEY") {
        payload.phoneNumber = formatPhoneNumber(phoneNumber);
      }

      const response = await apiRequest(
        MEALSALEENDPOINTS.RECORD_ORDER.COLLECT_PAYMENT,
        "POST",
        "",
        payload,
      );

      console.log("Payment response:", response);

      if (selectedPaymentMethod === "CASH") {
        // For cash, complete immediately
        if (bill) {
          payBill(bill.id);
        }
        refresh();
        refreshPendingBills?.();

        // Toast message comes from backend
        onSuccess?.();
        onClose();
      } else {
        // For mobile money, check for reference and open waiting modal
        const reference = response?.data?.transaction?.reference || response?.reference;

        if (reference) {
          setPaymentReference(reference);
          setShowWaitingModal(true);
        } else {
          // No reference returned - show error from backend
          toast.error(
            response?.data?.message ||
              "Failed to initiate mobile money payment",
          );
          setIsProcessing(false);
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      // Toast message comes from backend
      setIsProcessing(false);
    } finally {
      if (selectedPaymentMethod === "CASH") {
        setIsProcessing(false);
      }
      // For mobile money, keep isProcessing true until waiting modal completes or fails
    }
  };

  const handlePayment = () => {
    processPayment();
  };

  const getPaymentMethodIcon = () => {
    if (selectedPaymentMethod === "CASH") {
      return <Banknote className="h-5 w-5" />;
    }
    return <Smartphone className="h-5 w-5" />;
  };

  if (!bill) return null;

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  return (
    <>
      <Dialog open={!!bill} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-lg">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Table {bill.tableId} - Payment
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Order Summary */}
            <div className="mb-4 rounded-md border p-3">
              <h3 className="mb-2 text-sm font-semibold">Order Summary</h3>
              <ul className="space-y-1 text-sm">
                {bill.items.map((it) => (
                  <li key={it.menuItemId} className="flex justify-between">
                    <span>
                      {it.quantity}× {it.name}
                    </span>
                    <span>UGX {(it.price * it.quantity).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t pt-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>UGX {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (7%)</span>
                  <span>UGX {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>UGX {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <Tabs
              defaultValue="CASH"
              onValueChange={(value) =>
                setSelectedPaymentMethod(value as "CASH" | "MOBILE_MONEY")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="CASH" className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Cash
                </TabsTrigger>
                <TabsTrigger
                  value="MOBILE_MONEY"
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile Money
                </TabsTrigger>
              </TabsList>

              <TabsContent value="CASH" className="pt-4">
                <div className="rounded-md bg-muted/50 p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <Banknote className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Collect{" "}
                    <strong className="text-foreground">
                      UGX {total.toLocaleString()}
                    </strong>{" "}
                    in cash.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Ensure you count the cash and provide change if necessary.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="MOBILE_MONEY" className="pt-4 space-y-4">
                <div>
                  <Label
                    htmlFor="phoneNumber"
                    className="mb-2 block text-sm font-medium"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (phoneError) validatePhoneNumber(e.target.value);
                    }}
                    placeholder="Enter phone number (e.g., 07xx... or +256xxx...)"
                    className={phoneError ? "border-red-500" : ""}
                    disabled={isProcessing}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Number will be formatted to +256 format
                  </p>
                </div>

                <div className="rounded-md bg-muted/50 p-4 text-center">
                  <div className="mb-2 flex justify-center">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Charge{" "}
                    <strong className="text-foreground">
                      UGX {total.toLocaleString()}
                    </strong>{" "}
                    via Mobile Money.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Customer will receive a prompt on their phone to complete
                    payment.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {isProcessing && selectedPaymentMethod === "CASH" && (
              <div className="mt-4 rounded-md bg-primary/10 p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing payment...</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t p-4">
            <Button
              className="flex-1"
              onClick={handlePayment}
              disabled={
                isProcessing ||
                (selectedPaymentMethod === "MOBILE_MONEY" &&
                  (!phoneNumber || !!phoneError))
              }
            >
              {getPaymentMethodIcon()}
              <span className="ml-2">
                {isProcessing
                  ? "Processing..."
                  : `Pay with ${selectedPaymentMethod === "CASH" ? "Cash" : "Mobile Money"}`}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Waiting Modal for polling */}
      <PaymentWaitingModal
        visible={showWaitingModal}
        reference={paymentReference}
        onClose={() => {
          setShowWaitingModal(false);
          setPaymentReference(null);
          setIsProcessing(false);
        }}
        onPaymentComplete={handlePaymentComplete}
        onPaymentFailed={handlePaymentFailed}
      />
    </>
  );
}
