export interface IChannel {
  id: number;
  type: 'BANK_TRANSFER' | 'MOBILE_MONEY';
  name: string;
  phoneNumber: string | null;
  bank: string | null;
  accountNumber: string | null;
  isVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
//   // Optional relations if needed
//   Wallet?: IWallet[];
//   WithdrawHistory?: IWithdrawHistory[];
}

export interface ISupportedBanks {
    code: string;
    name: string;
    aliases: string[];
}

export interface IWallet {
  id: number;
  name: string;
  purpose?: string | null;
  balance: number;
  createdAt: string;
  isForSales: boolean;
  isForTickets: boolean;
  canBeDeleted: boolean;
  updatedAt: string;

//   Withdraw?: Withdraw[];
//   Event?: Event[];
}

export interface ITransaction {
  id: number;
  salePaymentId: number;
  transaction_uuid: string;
  transaction_reference: string;
  provider_transaction_id?: string;
  amount: string | number;
  amount_formatted?: string;
  currency: string;
  payment_method: string;
  provider: string;
  provider_mode?: string;
  phone_number: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'PROCESSING';
  event_type?: string | null;
  description: string;
  notes?: string;
  cashierId: number;
  webhook_received_at: string;
  webhook_payload?: unknown;
  transaction_initiated_at: string;
  transaction_completed_at?: string | null;
  created_at: string;
  updated_at: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
  };
}