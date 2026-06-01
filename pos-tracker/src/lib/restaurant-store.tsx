import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type Bill,
  type OrderItem,
  type TableEntity,
  calcTotals,
} from "./restaurant-data";

interface StoreState {
  employeeId: string | null;
  tables: TableEntity[];
  bills: Bill[];
  login: (pin: string) => boolean;
  logout: () => void;
  placeOrder: (tableId: number, items: OrderItem[]) => void;
  addToBill: (billId: string, items: OrderItem[]) => void;
  payBill: (billId: string) => void;
  getBill: (id?: string) => Bill | undefined;
}

const Ctx = createContext<StoreState | null>(null);

const VALID_PIN = "1234";
const STORAGE = "restaurant_state_v1";

function initialTables(): TableEntity[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    status: "FREE",
  }));
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [tables, setTables] = useState<TableEntity[]>(initialTables);
  const [bills, setBills] = useState<Bill[]>([]);

  // Persist
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.tables) setTables(data.tables);
        if (data.bills)
          setBills(
            data.bills.map((b: Bill) => ({
              ...b,
              createdAt: new Date(b.createdAt),
            })),
          );
        if (data.employeeId) setEmployeeId(data.employeeId);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE,
      JSON.stringify({ employeeId, tables, bills }),
    );
  }, [employeeId, tables, bills]);

  const login = (pin: string) => {
    if (pin === VALID_PIN) {
      setEmployeeId("emp_001");
      return true;
    }
    return false;
  };

  const logout = () => setEmployeeId(null);

  const placeOrder = (tableId: number, items: OrderItem[]) => {
    if (!employeeId || items.length === 0) return;
    const { subtotal, tax, total } = calcTotals(items);
    const bill: Bill = {
      id: `bill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tableId,
      employeeId,
      items,
      subtotal,
      tax,
      total,
      status: "PENDING",
      createdAt: new Date(),
    };
    setBills((b) => [...b, bill]);
    setTables((ts) =>
      ts.map((t) =>
        t.id === tableId
          ? { ...t, status: "OCCUPIED", currentBillId: bill.id }
          : t,
      ),
    );
  };

  const addToBill = (billId: string, newItems: OrderItem[]) => {
    setBills((bs) =>
      bs.map((b) => {
        if (b.id !== billId) return b;
        const merged: OrderItem[] = [...b.items];
        for (const it of newItems) {
          const existing = merged.find((m) => m.menuItemId === it.menuItemId);
          if (existing) existing.quantity += it.quantity;
          else merged.push({ ...it });
        }
        const { subtotal, tax, total } = calcTotals(merged);
        return { ...b, items: merged, subtotal, tax, total };
      }),
    );
  };

  const payBill = (billId: string) => {
    let tableId: number | null = null;
    setBills((bs) =>
      bs.map((b) => {
        if (b.id === billId) {
          tableId = b.tableId;
          return { ...b, status: "PAID" };
        }
        return b;
      }),
    );
    if (tableId !== null) {
      setTables((ts) =>
        ts.map((t) =>
          t.id === tableId
            ? { ...t, status: "FREE", currentBillId: undefined }
            : t,
        ),
      );
    }
  };

  const getBill = (id?: string) => bills.find((b) => b.id === id);

  return (
    <Ctx.Provider
      value={{
        employeeId,
        tables,
        bills,
        login,
        logout,
        placeOrder,
        addToBill,
        payBill,
        getBill,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useRestaurant must be used inside RestaurantProvider");
  return ctx;
}
