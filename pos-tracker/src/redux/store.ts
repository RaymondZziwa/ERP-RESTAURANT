import UserAuthReducer from "./slices/auth/userAuthSlice";
import ItemCategoryReducer from "./slices/inventory/itemCategorySlice";
import ItemReducer from "./slices/inventory/itemSlice";
import CreditSaleReducer from "./slices/sales/creditSaleSlice";
import channelReducer from "./slices/finance/channelSlice";
import supportedBanksReducer from "./slices/finance/supportedBanksSlice";
import walletReducer from "./slices/finance/walletSlice";
import transactionReducer from "./slices/finance/transactionSlice";
import billingChannelReducer from "./slices/settings/billingChannelSlice";
import tableReducer from "./slices/sales/tableSlice";
import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storageSync from "redux-persist/lib/storage";

// Use localStorage only if available (browser environment)
const storage =
  typeof window !== "undefined" && window.localStorage
    ? storageSync
    : createNoopStorage();

function createNoopStorage() {
  return {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
}

// Persist config for userAuth
const userAuthPersistConfig = {
  key: "userAuth",
  storage,
  whitelist: ["data"],
};

const persistedUserAuthReducer = persistReducer(
  userAuthPersistConfig,
  UserAuthReducer,
);

export const store = configureStore({
  reducer: {
    table: tableReducer,
    userAuth: persistedUserAuthReducer,
    itemCategory: ItemCategoryReducer,
    item: ItemReducer,
    creditSale: CreditSaleReducer,
    channel: channelReducer,
    supportedBanks: supportedBanksReducer,
    wallet: walletReducer,
    transaction: transactionReducer,
    billingChannel: billingChannelReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
