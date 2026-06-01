export const ChannelEndpoints = {
    createChannel: "/api/channels/create",               
    listChannels: "/api/channels/all",                
    updateChannel: (id: string) => `/api/channels/modify/${id}`,
    deleteChannel: (id: string) => `/api/channels/delete/${id}`,
    upcomingEvents: "/api/events/upcoming/all",     
    getSupportedBanks: "/api/channels/supported-banks",
    validateBankDetails: "/api/channels/bank-account/validation",
    requestMobileVerificationCode: (id: string) => `/api/channels/${id}/mobile-money/send-code`,
    verifyMobileMoney: (id: string) => `/api/channels/${id}/mobile-money/verify`,
    verifyBankTransfer: (id: string) => `/api/channels/bank-account/validation/${id}`,
  };
  
  export const WalletEndpoints = {
    createWallet: "/api/wallets/create",
    listWallets: "/api/wallets/all",
    updateWallet: (id: string) => `/api/wallets/modify/${id}`,
    deleteWallet: (id: string) => `/api/wallets/delete/${id}`,
    toggleWalletIsForSales: (id: string) => `/api/wallets/toggle/${id}`,
    toggleWalletIsForTickets: (id: string) => `/api/wallets/toggle-for-ticket-sales/${id}`,
  };

  export const TransactionEndpoints = {
    listTransactions: "/api/transactions/all",
    createTransaction: "/api/transactions/create",
    getTransaction: (id: string) => `/api/transactions/${id}`,
    withdrawFromWallet: "/api/transactions/withdraw",
    checkBankTransferStatus: (reference: string) => `/api/transactions/bank-transfer-status/${reference}`,
    sendMoney: "/api/transactions/send-mobile-money",
  };