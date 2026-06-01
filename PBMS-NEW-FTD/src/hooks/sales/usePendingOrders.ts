// hooks/sales/usePendingOrders.ts
import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDataStart, fetchDataSuccess, fetchDataFailure } from "../../redux/slices/sales/pendingOrdersSlice";
import { apiRequest } from "../../libs/apiConfig";
import type { RootState } from "../../redux/store";
import { SALESENDPOINTS } from "../../endpoints/sales/salesEndpoints";

const usePendingOrders = () => {
  const dispatch = useDispatch();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const fetchDataFromApi = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    dispatch(fetchDataStart());

    try {
      const response = await apiRequest(
        SALESENDPOINTS.POS.get_pending_orders,
        "GET",
        '',
      );

      if (response.status === 200) {
        dispatch(fetchDataSuccess(response.data));
      } else {
        throw new Error("Failed to fetch pending orders.");
      }
    } catch (error) {
      console.error("Failed to fetch pending orders:", error);
      dispatch(
        fetchDataFailure(
          error instanceof Error ? error.message : "An unknown error occurred."
        )
      );
    } finally {
      isPollingRef.current = false;
    }
  }, [dispatch]);

  // Set up polling every 30 seconds
  useEffect(() => {
    // Initial fetch
    fetchDataFromApi();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchDataFromApi();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchDataFromApi]);

  const data = useSelector((state: RootState) => state.pendingOrders);

  return { ...data, refresh: fetchDataFromApi };
};

export default usePendingOrders;