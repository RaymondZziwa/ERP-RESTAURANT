import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDataStart, fetchDataSuccess, fetchDataFailure } from "../../redux/slices/sales/orderHistorySlice";
import { apiRequest } from "../../libs/apiConfig";
import type { RootState } from "../../redux/store";
import { SALESENDPOINTS } from "../../endpoints/sales/salesEndpoints";

const useOrderHistory = () => {
  const dispatch = useDispatch();
  //const { token, isFetchingLocalToken } = useAuth();

  const fetchDataFromApi = async () => {
    //if (isFetchingLocalToken || !token?.access_token) return;

    dispatch(fetchDataStart()); // Dispatch action to indicate data fetching has started

    try {
        const response = await apiRequest(
          SALESENDPOINTS.POS.get_order_history,
          "GET",
            '',
        );
        //console.log(response)
        if (response.status == 200) {
          //console.log('subs data', response.data)
          dispatch(fetchDataSuccess(response.data)); // Dispatch action with fetched data
        } else {
          throw new Error("Failed to fetch order history.");
        }
    } catch (error) {
      console.error("Failed to fetch order history:", error);
      dispatch(
        fetchDataFailure(
          error instanceof Error ? error.message : "An unknown error occurred."
        )
      );
    }
  };

  useEffect(()=> {
    fetchDataFromApi()
  }, [])


const data = useSelector((state: RootState) => state.orderHistory);

return { ...data, refresh: fetchDataFromApi };
};

export default useOrderHistory
