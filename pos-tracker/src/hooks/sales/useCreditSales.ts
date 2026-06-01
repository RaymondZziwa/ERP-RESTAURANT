import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchDataStart, fetchDataSuccess, fetchDataFailure } from "../../redux/slices/sales/creditSaleSlice";
import { apiRequest } from "../../libs/apiConfig";
import type { RootState } from "../../redux/store";
import { SALESENDPOINTS } from "../../endpoints/sales/salesEndpoints";

const useCreditSale = (id: string) => {
  const dispatch = useDispatch();
  //const { token, isFetchingLocalToken } = useAuth();

  const fetchDataFromApi = async (id: string) => {
    //if (isFetchingLocalToken || !token?.access_token) return;

    dispatch(fetchDataStart()); // Dispatch action to indicate data fetching has started

    try {
      if (id) {
        const response = await apiRequest(
          SALESENDPOINTS.POS.get_credit_sales(id),
          "GET",
            '',
        );
        //console.log(response)
        if (response.status == 200) {
          //console.log('subs data', response.data)
          dispatch(fetchDataSuccess(response.data)); // Dispatch action with fetched data
        } else {
          throw new Error("Failed to fetch credit sales.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch credit sales:", error);
      dispatch(
        fetchDataFailure(
          error instanceof Error ? error.message : "An unknown error occurred."
        )
      );
    }
  };

  useEffect(()=> {
    fetchDataFromApi(id)
  }, [id])


const data = useSelector((state: RootState) => state.creditSale);

return { ...data, refresh: fetchDataFromApi };
};

export default useCreditSale
