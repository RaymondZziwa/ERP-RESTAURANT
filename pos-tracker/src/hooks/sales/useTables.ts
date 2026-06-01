import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDataStart,
  fetchDataSuccess,
  fetchDataFailure,
} from "../../redux/slices/sales/tableSlice";
import type { RootState } from "../../redux/store";
import { apiRequest } from "@/lib/api/apiConfig";
import { SALESENDPOINTS } from "@/endpoints/sales/salesEndpoints";

const useTables = () => {
  const dispatch = useDispatch();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const isPageVisibleRef = useRef(true);
  //const { token, isFetchingLocalToken } = useAuth();

  const fetchDataFromApi = useCallback(async () => {
    // Only fetch if page is visible
    if (!isPageVisibleRef.current) return;

    // Prevent multiple simultaneous requests
    if (isPollingRef.current) return;

    //if (isFetchingLocalToken || !token?.access_token) return;

    isPollingRef.current = true;
    dispatch(fetchDataStart()); // Dispatch action to indicate data fetching has started

    try {
      const response = await apiRequest(
        SALESENDPOINTS.TABLE.fetch_all,
        "GET",
        "",
      );
      //console.log(response)
      if (response.status == 200) {
        //console.log('subs data', response.data)
        dispatch(fetchDataSuccess(response.data)); // Dispatch action with fetched data
      } else {
        throw new Error("Failed to fetch tables.");
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      dispatch(
        fetchDataFailure(
          error instanceof Error ? error.message : "An unknown error occurred.",
        ),
      );
    } finally {
      isPollingRef.current = false;
    }
  }, [dispatch]);

  // Handle page visibility change
  const handleVisibilityChange = useCallback(() => {
    isPageVisibleRef.current = document.visibilityState === "visible";

    // If page becomes visible again, fetch immediately
    if (isPageVisibleRef.current) {
      fetchDataFromApi();
    }
  }, [fetchDataFromApi]);

  // Set up polling and visibility listener
  useEffect(() => {
    // Initial fetch
    fetchDataFromApi();

    // Set up polling every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchDataFromApi();
    }, 30000); // 30 seconds

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDataFromApi, handleVisibilityChange]);

  const data = useSelector((state: RootState) => state.table);

  return { ...data, refresh: fetchDataFromApi };
};

export default useTables;
