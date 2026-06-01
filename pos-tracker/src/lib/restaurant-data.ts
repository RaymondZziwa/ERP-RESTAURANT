export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Bill {
  id: number;
  tableId: number;
  items: OrderItem[];
  servedBy: number;
  saleStatus: string; // "COMPLETE", "PENDING", "PROCESSING", etc.
  status: "FULLY_PAID" | "PARTIALLY_PAID" | "UNPAID";
  total: string | number;
  balance: string | number;
  paymentMethod: string | null;
  notes: string;
  isReceiptPrinted: boolean;
  updatedAt: string;
  createdAt: string;
  table?: {
    id: number;
    number: number;
    status: string;
    updatedAt: string;
    createdAt: string;
  };
  SalePayments?: Array<{
    id: number;
    amount: string | number;
    paymentMethod: string;
    referenceId: string;
    notes: string;
    cashierId: number;
    updatedAt: string;
    createdAt: string;
    mealSaleId: number;
  }>;
}

export interface OrderItem {
  menuItemId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface TableEntity {
  id: number;
  number: number;
  status: "FREE" | "OCCUPIED";
  currentBillId?: string;
}

export const CATEGORIES = [
  "Appetizers",
  "Main Courses",
  "Desserts",
  "Beer",
  "Wine",
  "Cocktails",
  "Soft Drinks",
] as const;

export const MENU: MenuItem[] = [
  { id: "wings", name: "Wings", price: 12, category: "Appetizers" },
  { id: "fries", name: "Fries", price: 6, category: "Appetizers" },
  { id: "salad", name: "Salad", price: 8, category: "Appetizers" },
  { id: "burger", name: "Burger", price: 15, category: "Main Courses" },
  { id: "pizza", name: "Pizza", price: 18, category: "Main Courses" },
  { id: "pasta", name: "Pasta", price: 14, category: "Main Courses" },
  { id: "cheesecake", name: "Cheesecake", price: 7, category: "Desserts" },
  { id: "icecream", name: "Ice Cream", price: 5, category: "Desserts" },
  { id: "draft", name: "Draft Beer", price: 6, category: "Beer" },
  { id: "wine", name: "Wine", price: 9, category: "Wine" },
  { id: "margarita", name: "Margarita", price: 11, category: "Cocktails" },
  { id: "coke", name: "Coke", price: 3, category: "Soft Drinks" },
  { id: "water", name: "Water", price: 2, category: "Soft Drinks" },
];

export const TAX_RATE = 0.07;

export function calcTotals(items: OrderItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
}
