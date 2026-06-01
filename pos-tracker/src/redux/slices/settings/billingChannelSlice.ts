import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DataState } from "../generic";
import type { IBillingChannel } from "../../types/systemSettings";

const initialState: DataState<IBillingChannel[]> = {
  data: [],
  loading: false,
  error: null,
};

const billingChannelSlice = createSlice({
  name: "billingChannel",
  initialState,
  reducers: {
    fetchDataStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchDataSuccess(state, action: PayloadAction<IBillingChannel[]>) {
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
billingChannelSlice.actions;
export default billingChannelSlice.reducer;
