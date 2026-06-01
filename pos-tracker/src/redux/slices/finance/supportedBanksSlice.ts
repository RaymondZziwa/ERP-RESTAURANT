import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DataState } from "../generic";
import type { ISupportedBanks } from "../../types/finance";

const initialState: DataState<ISupportedBanks[]> = {
  data: [],
  loading: false,
  error: null,
};

const supportedBanksSlice = createSlice({
  name: "supportedBanks",
  initialState,
  reducers: {
    fetchDataStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchDataSuccess(state, action: PayloadAction<ISupportedBanks[]>) {
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
supportedBanksSlice.actions;
export default supportedBanksSlice.reducer;
