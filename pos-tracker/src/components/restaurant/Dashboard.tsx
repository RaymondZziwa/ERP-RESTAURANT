import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, LogOut, Table2, History } from "lucide-react";
import { useRestaurant } from "@/lib/restaurant-store";
import { SelectTableDialog } from "./SelectTableDialog";
import { OrderDialog } from "./OrderDialog";
import { PendingBillsDialog } from "./PendingBillsDialog";
import { PaymentDialog } from "./PaymentDialog";
import { PastOrdersDialog } from "./PastOrdersDialog";
import type { Bill } from "@/lib/restaurant-data";
import useTables from "@/hooks/sales/useTables";
import { MEALSALEENDPOINTS } from "@/endpoints/sales/mealSaleEndpoints";
import { apiRequest } from "@/lib/api/apiConfig";
import { toast } from "sonner";

export function Dashboard() {
  const { data: tables } = useTables();
  const { bills, logout, getBill, employeeId } = useRestaurant();
  const [selectOpen, setSelectOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const [orderTable, setOrderTable] = useState<number | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pastBills, setPastBills] = useState<Bill | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const pastCount = bills.filter(
    (b) => b.employeeId === employeeId && b.status === "PAID",
  ).length;
  const [numberOfPendingBills, setNumberOfPendingBills] = useState(0);
  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
   const [numberOfPastBills, setNumberOfPastBills] = useState(0);

  const openNewOrder = () => setSelectOpen(true);

  const handleTableClick = (tableId: number) => {
    setSelectedTableId(tableId);
    const t = tables.find((x) => x.id === tableId)!;

    if (t.status === "OCCUPIED") {
      // Show appropriate message based on whether there's a bill
      if (t.currentBillId) {
        const bill = getBill(t.currentBillId);
        if (bill) {
          // Table has an active bill - proceed to payment
          setPayingBill(bill);
          toast.info(
            `Table ${t.number} has an unpaid bill of UGX ${bill.total.toLocaleString()}. Please process payment.`,
          );
        } else {
          // Table marked occupied but no bill - error state
          toast.error(
            `Table ${t.number} is marked as occupied but has no active bill. Please contact administrator.`,
          );
        }
      } else {
        // Table is occupied with no bill - cannot place new order
        toast.error(
          `Cannot place new order. Table ${t.number} is currently occupied.`,
        );
      }
    } else if (t.status === "RESERVED") {
      // Optional: Handle reserved tables
      toast.warning(
        `Table ${t.number} is reserved. Please check with the host before assigning.`,
      );
    } else if (t.status === "AVAILABLE") {
      // Table is free - allow new order
      setOrderTable(t.number);
      toast.success(`Creating new order for Table ${t.number}`);
    } else {
      // Handle other statuses like OUT_OF_SERVICE
      toast.error(
        `Table ${t.number} is ${t.status.toLowerCase()}. Cannot place order.`,
      );
    }
  };

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

  useEffect(() => {
    if (user.id) {
      fetchPendingBills();
      fetchPastBills();
    }
  }, []);

  const fetchPendingBills = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint =
        MEALSALEENDPOINTS.RECORD_ORDER.GET_EMPLOYEE_PENDING_BILLS(user.id);
      const response = await apiRequest(endpoint, "GET", "");

      console.log("Pending bills response:", response);

      setNumberOfPendingBills(response.data.length);
      setPendingBills(response.data);
    } catch (error: any) {
      console.error("Error fetching pending bills:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load pending bills",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPastBills = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsFetching(true);

    try {
      const endpoint = MEALSALEENDPOINTS.RECORD_ORDER.GET_EMPLOYEE_PAST_BILLS(
        user.id,
      );
      const response = await apiRequest(endpoint, "GET", "");

      console.log("Past bills response:", response);

      setPastBills(response.data);
      setNumberOfPastBills(response.data.length);
    } catch (error: any) {
      console.error("Error fetching past bills:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load past bills",
      );
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-56 flex-col border-r bg-card p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 font-bold">
          <Table2 className="h-5 w-5 text-primary" />
          Table Manager
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          <Button onClick={openNewOrder} className="justify-start">
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>
          <Button
            onClick={() => setPendingOpen(true)}
            variant="outline"
            className="justify-start"
          >
            <Receipt className="mr-2 h-4 w-4" /> Pending Bills
            <Badge variant="secondary" className="ml-auto">
              {numberOfPendingBills}
            </Badge>
          </Button>
          <Button
            onClick={() => setPastOpen(true)}
            variant="outline"
            className="justify-start"
          >
            <History className="mr-2 h-4 w-4" /> Past Orders
            <Badge variant="secondary" className="ml-auto">
              {numberOfPastBills}
            </Badge>
          </Button>
        </nav>
        <Button variant="ghost" onClick={logout} className="justify-start">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b bg-card p-3 md:hidden">
        <div className="flex items-center gap-2 font-bold">
          <Table2 className="h-5 w-5 text-primary" />
          Tables
        </div>
        <Button size="sm" variant="ghost" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
        <h1 className="mb-4 text-2xl font-bold">Tables</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tables.map((t) => {
            const bill = t.currentBillId ? getBill(t.currentBillId) : undefined;
            const occupied = t.status === "OCCUPIED";
            return (
              <Card
                key={t.id}
                onClick={() => handleTableClick(t.id)}
                className={`group relative cursor-pointer overflow-hidden p-4 transition-all hover:scale-[1.03] hover:shadow-lg active:scale-95 ${
                  occupied
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-green-500/40 bg-green-500/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl font-bold">{t.number}</div>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      occupied ? "bg-red-500" : "bg-green-500"
                    }`}
                  />
                </div>
                <div
                  className={`mt-2 text-xs font-semibold ${
                    occupied
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {t.status}
                </div>
                {occupied && bill && (
                  <div className="mt-2 text-lg font-semibold">
                    ${bill.total.toFixed(2)}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t bg-card p-2 md:hidden">
        <Button size="sm" onClick={openNewOrder}>
          <Plus className="mr-1 h-4 w-4" /> Order
        </Button>
        <Button
          size="sm"
          onClick={() => setPendingOpen(true)}
          variant="outline"
        >
          <Receipt className="mr-1 h-4 w-4" /> Bills
          <Badge variant="secondary" className="ml-1">
            {numberOfPendingBills}
          </Badge>
        </Button>
        <Button size="sm" onClick={() => setPastOpen(true)} variant="outline">
          <History className="mr-1 h-4 w-4" /> Past
          <Badge variant="secondary" className="ml-1">
            {numberOfPastBills}
          </Badge>
        </Button>
      </nav>

      <SelectTableDialog
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onSelect={(id) => setOrderTable(id)}
      />
      {orderTable !== null && (
        <OrderDialog
          open={orderTable !== null}
          onOpenChange={(v) => !v && setOrderTable(null)}
          tableId={orderTable}
          selectedTableId={selectedTableId}
          existingBillId={
            tables.find((t) => t.id === orderTable)?.currentBillId
          }
          refreshPendingBills={fetchPendingBills}
        />
      )}
      <PendingBillsDialog
        open={pendingOpen}
        onOpenChange={setPendingOpen}
        onSelect={(b) => setPayingBill(b)}
        setNumberOfPendingBills={setNumberOfPendingBills}
        pendingBills={pendingBills}
        isLoading={isLoading}
      />
      <PastOrdersDialog
        open={pastOpen}
        onOpenChange={setPastOpen}
        pastBills={pastBills}
        isFetching={isFetching}
      />
      <PaymentDialog
        bill={payingBill}
        onClose={() => setPayingBill(null)}
        refreshPendingBills={fetchPendingBills}
      />
    </div>
  );
}
