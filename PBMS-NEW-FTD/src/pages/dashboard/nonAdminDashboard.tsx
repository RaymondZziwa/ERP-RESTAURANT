import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { apiRequest } from "../../libs/apiConfig";

const NonAdminDashboard: React.FC = () => {
  type EmployeeMetricsResponse = {
    status: number;
    message: string;
    data: {
      inventory: {
        totalInventoryRecords: number;
        outOfStockCount: number;
        lowStockCount: number;
        inStockCount: number;
        overStockedCount: number;
        lowStockItems: Array<{
          itemId?: number;
          itemName?: string;
          category?: string;
          qty?: number;
          unit?: string;
          storeId?: number;
          storeName?: string;
        }>;
        recentInventoryActivity: Array<{
          id: number;
          category: string;
          qty: number;
          transferStatus?: string;
          createdAt: string;
          item?: { id: number; name: string };
          unit?: { name: string };
          store?: { id: number; name: string };
          toStore?: { id: number; name: string } | null;
          employee?: { firstName: string; lastName: string };
        }>;
      };
      sales: {
        range: { startDate: string; endDate: string; days: number };
        totalSalesCount: number;
        statusCounts: Record<string, number>;
        totalItemsSold: number;
        topItemsByQuantity: Array<{ name: string; quantity: number }>;
        recentSales: Array<{
          id: number;
          status: string;
          createdAt: string;
          storeId?: number;
          storeName?: string;
          servedBy: string;
          clientName?: string;
          itemsCount: number;
        }>;
      };
      expenses: {
        range: { startDate: string; endDate: string; days: number };
        totalExpenseEntries: number;
        byCategory: Record<string, number>;
        recentExpenses: Array<{
          id: number;
          title: string;
          category: string;
          dateIncurred: string;
          branchId?: number;
          branchName?: string;
          recordedBy: string;
        }>;
      };
    };
  };

  const branchIdRaw = useSelector(
    (state: RootState) => state.userAuth.data.branch?.id,
  );

  const branchId = useMemo(() => {
    const num = Number(branchIdRaw);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }, [branchIdRaw]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [payload, setPayload] = useState<EmployeeMetricsResponse | null>(null);

  const fetchEmployeeMetrics = useCallback(async () => {
    // Employee metrics endpoint is disabled - focus on mealSale-specific dashboard
    setLoading(true);
    setError("Employee metrics dashboard is currently disabled. Please use the main dashboard.");
    setPayload(null);
    setLoading(false);
    
    // Original code (commented out):
    // setLoading(true);
    // setError("");
    // try {
    //   const query = new URLSearchParams();
    //   if (branchId) query.set("branchId", String(branchId));
    //   query.set("salesDays", "7");
    //   query.set("expenseDays", "30");
    //
    //   const endpoint = query.toString()
    //     ? `/api/dashboard/employee-metrics?${query.toString()}`
    //     : "/api/dashboard/employee-metrics";
    //
    //   const res = await apiRequest<EmployeeMetricsResponse>(endpoint, "GET");
    //   setPayload(res);
    // } catch (e) {
    //   setPayload(null);
    //   setError(e instanceof Error ? e.message : "Failed to load dashboard");
    // } finally {
    //   setLoading(false);
    // }
  }, [branchId]);

  useEffect(() => {
    fetchEmployeeMetrics();
  }, [fetchEmployeeMetrics]);

  const formatDateTime = (value?: string) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString("en-GB");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100 p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Operational overview (no financial figures)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEmployeeMetrics}
          disabled={loading}
          className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          <div className="font-medium">Failed to load dashboard</div>
          <div className="mt-1 text-red-600">{error}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Low stock items</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">
            {loading ? "..." : payload?.data.inventory.lowStockCount ?? 0}
          </div>
          <div className="mt-2 text-xs text-gray-500">Qty 1 - 20</div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Out of stock</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">
            {loading ? "..." : payload?.data.inventory.outOfStockCount ?? 0}
          </div>
          <div className="mt-2 text-xs text-gray-500">Qty 0</div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Sales (last 7 days)</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">
            {loading ? "..." : payload?.data.sales.totalSalesCount ?? 0}
          </div>
          <div className="mt-2 text-xs text-gray-500">Count only</div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Expenses entries (30 days)</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">
            {loading ? "..." : payload?.data.expenses.totalExpenseEntries ?? 0}
          </div>
          <div className="mt-2 text-xs text-gray-500">Count only</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Low stock preview</h2>
            <div className="text-xs text-gray-500">Top 10</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold text-gray-500">
                  <th className="w-[45%] pb-2">Item</th>
                  <th className="w-[20%] pb-2">Qty</th>
                  <th className="w-[35%] pb-2">Store</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(payload?.data.inventory.lowStockItems ?? []).length === 0 ? (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan={3}>
                      {loading ? "Loading..." : "No low stock items"}
                    </td>
                  </tr>
                ) : (
                  (payload?.data.inventory.lowStockItems ?? []).map((row) => (
                    <tr key={`${row.storeId ?? ""}-${row.itemId ?? ""}`}>
                      <td className="py-2 pr-2">
                        <div className="truncate font-medium text-gray-800" title={row.itemName}>
                          {row.itemName}
                        </div>
                        <div className="truncate text-xs text-gray-500" title={row.category}>
                          {row.category}
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-gray-700">
                        {row.qty} {row.unit}
                      </td>
                      <td className="py-2 text-gray-700">
                        <div className="truncate" title={row.storeName}>
                          {row.storeName}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Sales overview</h2>
            <div className="text-xs text-gray-500">Last 7 days</div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Items sold</div>
              <div className="mt-1 text-xl font-bold text-gray-800">
                {loading ? "..." : payload?.data.sales.totalItemsSold ?? 0}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Paid status counts</div>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {Object.keys(payload?.data.sales.statusCounts ?? {}).length === 0 ? (
                  <div className="text-gray-500">{loading ? "Loading..." : "No data"}</div>
                ) : (
                  Object.entries(payload?.data.sales.statusCounts ?? {}).map(
                    ([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="truncate pr-2">{k}</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-gray-800">Top items (qty)</div>
            <div className="mt-2 space-y-2">
              {(payload?.data.sales.topItemsByQuantity ?? []).length === 0 ? (
                <div className="text-sm text-gray-500">{loading ? "Loading..." : "No items"}</div>
              ) : (
                (payload?.data.sales.topItemsByQuantity ?? []).map((it) => (
                  <div key={it.name} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 text-gray-700" title={it.name}>
                      {it.name}
                    </span>
                    <span className="font-medium text-gray-800">{it.quantity}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent inventory activity</h2>
            <div className="text-xs text-gray-500">Last 10</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold text-gray-500">
                  <th className="w-[30%] pb-2">Item</th>
                  <th className="w-[18%] pb-2">Qty</th>
                  <th className="w-[18%] pb-2">Type</th>
                  <th className="w-[18%] pb-2">Status</th>
                  <th className="w-[16%] pb-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(payload?.data.inventory.recentInventoryActivity ?? []).length === 0 ? (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan={5}>
                      {loading ? "Loading..." : "No inventory activity"}
                    </td>
                  </tr>
                ) : (
                  (payload?.data.inventory.recentInventoryActivity ?? []).map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-2">
                        <div className="truncate font-medium text-gray-800" title={r.item?.name}>
                          {r.item?.name}
                        </div>
                        <div className="truncate text-xs text-gray-500" title={r.store?.name}>
                          {r.store?.name}
                          {r.toStore?.name ? ` → ${r.toStore.name}` : ""}
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-gray-700">
                        {r.qty} {r.unit?.name}
                      </td>
                      <td className="py-2 pr-2 text-gray-700">{r.category}</td>
                      <td className="py-2 pr-2 text-gray-700">
                        {r.transferStatus ?? ""}
                      </td>
                      <td className="py-2 text-xs text-gray-600">
                        {formatDateTime(r.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent expenses</h2>
            <div className="text-xs text-gray-500">Last 10</div>
          </div>

          <div className="mt-4 space-y-3">
            {(payload?.data.expenses.recentExpenses ?? []).length === 0 ? (
              <div className="text-sm text-gray-500">{loading ? "Loading..." : "No entries"}</div>
            ) : (
              (payload?.data.expenses.recentExpenses ?? []).map((e) => (
                <div key={e.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="truncate text-sm font-medium text-gray-800" title={e.title}>
                    {e.title}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-600">
                    <span className="rounded bg-gray-100 px-2 py-0.5">
                      {e.category}
                    </span>
                    <span>{formatDateTime(e.dateIncurred)}</span>
                    <span className="truncate" title={e.branchName}>
                      {e.branchName}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">By {e.recordedBy}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonAdminDashboard;
