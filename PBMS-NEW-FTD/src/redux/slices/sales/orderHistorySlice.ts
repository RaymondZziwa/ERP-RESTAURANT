import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IBill } from "../../types/sales";
import type { DataState } from "../generic";

const initialState: DataState<IBill[]> = {
  data: [],
  loading: false,
  error: null,
};

const orderHistorySlice = createSlice({
  name: "orderHistory",
  initialState,
  reducers: {
    fetchDataStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchDataSuccess(state, action: PayloadAction<IBill[]>) {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchDataFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchDataStart, fetchDataSuccess, fetchDataFailure } =
orderHistorySlice.actions;
export default orderHistorySlice.reducer;
