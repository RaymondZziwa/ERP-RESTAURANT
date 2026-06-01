import { configureStore } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import branchReducer from './slices/settings/branchSlice';
import permissionReducer from './slices/settings/permissionSlice';
import roleReducer from './slices/settings/roleSlice';
import EventReducer from './slices/events/eventSlice';
import EmployeeReducer from './slices/humanResource/employeeSlice';
import DepartmentReducer from './slices/humanResource/departmentSlice';
import UserAuthReducer from './slices/auth/userAuthSlice';
import ItemCategoryReducer from './slices/inventory/itemCategorySlice';
import ItemReducer from './slices/inventory/itemSlice';
import ServiceReducer from './slices/inventory/serviceSlice';
import StoreReducer from './slices/inventory/storeSlice';
import StockMovementReducer from './slices/inventory/stockMovementSlice';
import UnitReducer from './slices/inventory/unitSlice';
import ClientReducer from './slices/sales/clientSlice';
import ProjectReducer from './slices/projects/projectSlice';
import ProjectSaleReducer from './slices/projects/projectSaleSlice';
import ExhibitionReducer from './slices/exhibition/exhibitionSlice';
import ExhibitionExpenseReducer from './slices/exhibition/exhibitionExpenseSlice';
import ExhibitionStoreReducer from './slices/exhibition/exhibitionStoreSlice';
import ExhibitionInventoryRecordReducer from './slices/exhibition/exhibitionInventoryRecordSlice';
import BranchExpenseReducer from './slices/expenses/branchExpenseSlice';
import StoreInventoryReducer from './slices/inventory/storeInventorySlice';
import ExhibitionStoreInventoryReducer from './slices/exhibition/exhibitionStoreInventory';
import CreditSaleReducer from './slices/sales/creditSaleSlice';
import AttendanceReducer from './slices/humanResource/attendanceSlice';
import PayrollReducer from './slices/humanResource/payrollSlice';
import DeliveryNoteReducer from './slices/inventory/deliveryNoteSlice';
import SupplierReducer from './slices/inventory/supplierSlice';
import pbpdReducer from './slices/humanResource/prescriptionDBSlice';
import seedlingBatchReducer from './slices/farm/batchSlice';
import seedlingDeathReducer from './slices/farm/deathSlice';
import seedlingGrowthReducer from './slices/farm/growthSlice';
import seedlingStageReducer from './slices/farm/stageSlice';
import ManufacturingReducer from './slices/manufacturing/manufacturingSlice';
import channelReducer from './slices/finance/channelSlice';
import supportedBanksReducer from './slices/finance/supportedBanksSlice';
import walletReducer from './slices/finance/walletSlice';
import transactionReducer from './slices/finance/transactionSlice';
import billingChannelReducer from './slices/settings/billingChannelSlice';
import tableReducer from './slices/sales/tableSlice';
import orderHistoryReducer from './slices/sales/orderHistorySlice';
import pendingOrdersReducer from './slices/sales/pendingOrdersSlice';

// Persist config for userAuth
const userAuthPersistConfig = {
  key: 'userAuth',
  storage,
  whitelist: ['data']
};

const persistedUserAuthReducer = persistReducer(userAuthPersistConfig, UserAuthReducer);

export const store = configureStore({
  reducer: {
    table: tableReducer,
    seedlingStage: seedlingStageReducer,
    seedlingBatch: seedlingBatchReducer,
    seedlingDeath: seedlingDeathReducer,
    seedlingGrowth: seedlingGrowthReducer,
    pbpd: pbpdReducer,
    branch: branchReducer,
    permission: permissionReducer,
    role: roleReducer,
    event: EventReducer,
    department: DepartmentReducer,
    employee: EmployeeReducer,
    userAuth: persistedUserAuthReducer,
    itemCategory: ItemCategoryReducer,
    item: ItemReducer,
    service: ServiceReducer,
    store: StoreReducer,
    stockMvt: StockMovementReducer,
    units: UnitReducer,
    client: ClientReducer,
    project: ProjectReducer,
    projectSale: ProjectSaleReducer,
    exhibition: ExhibitionReducer,
    exhibitionExpense: ExhibitionExpenseReducer,
    exhibitionStore: ExhibitionStoreReducer,
    exhibitionInventoryRecord: ExhibitionInventoryRecordReducer,
    branchExpense: BranchExpenseReducer,
    storeInventory: StoreInventoryReducer,
    exhibitionStoreInventory: ExhibitionStoreInventoryReducer,
    creditSale: CreditSaleReducer,
    attendance: AttendanceReducer,
    payroll: PayrollReducer,
    deliveryNotes: DeliveryNoteReducer,
    supplier: SupplierReducer,
    manufacturing: ManufacturingReducer,
    channel: channelReducer,
    supportedBanks: supportedBanksReducer,
    wallet: walletReducer,
    transaction: transactionReducer,
    billingChannel: billingChannelReducer,
    orderHistory: orderHistoryReducer,
    pendingOrders: pendingOrdersReducer,
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
