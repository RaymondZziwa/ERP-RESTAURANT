import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDataStart, fetchDataSuccess, fetchDataFailure } from "../../redux/slices/inventory/storeInventorySlice";
import { apiRequest } from "../../libs/apiConfig";
import type { RootState } from "../../redux/store";
import { InventoryEndpoints } from "../../endpoints/inventory/inventory";

const useStoreInventory = (id: string) => {
  const dispatch = useDispatch();
  //const { token, isFetchingLocalToken } = useAuth();

  const fetchDataFromApi = async (id: string) => {
    // Don't fetch if no store ID provided
    if (!id || id.trim() === '') {
      return;
    }

    //if (isFetchingLocalToken || !token?.access_token) return;

    dispatch(fetchDataStart());

    try {
      const response = await apiRequest(
          InventoryEndpoints.ITEM.fetch_store_inventory(id),
          "GET",
            '',
      );

      if (response.status == 200) {
        dispatch(fetchDataSuccess(response.data));
      } else {
        throw new Error("Failed to fetch store inventory.");
      }
    } catch (error) {
      console.error("Failed to fetch store inventory:", error);
      dispatch(
        fetchDataFailure(
          error instanceof Error ? error.message : "An unknown error occurred."
        )
      );
    }
  };

  useEffect(()=> {
    if (id && id.trim() !== '') {
      fetchDataFromApi(id);
    }
  }, [id])


const data = useSelector((state: RootState) => state.storeInventory);

return { ...data, refresh: fetchDataFromApi };
};

export default useStoreInventory
