export const FinanceRoutes = [
  {
    name: "Wallets",
    path: "/wallets",
    requiredPermission: "access_wallets_module"
  },
  {
    name: "Withdraw Channels",
    path: "/wallets/withdraw-channels",
    requiredPermission: "access_wallets_module"
  },
  {
    name: "Transactions",
    path: "/transactions",
    requiredPermission: "access_wallets_module"
  }
];
