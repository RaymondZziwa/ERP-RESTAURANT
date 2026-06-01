// TransactionsTable.tsx
import React, { useState } from 'react';
import { Eye, CheckCircle, XCircle, Clock, AlertCircle, Phone, DollarSign, User, Calendar, CreditCard } from 'lucide-react';
import CustomTable from '../../../custom/table/customTable';
import { formatDate } from '../../../libs/dateFormatter';
import TransactionDetailsModal from './detailsModal';
import useTransactions from '../../../hooks/finance/useTransactions';

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


const TransactionsTable = () => {
 const { data: transactions, refresh } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

  const getStatusIcon = (status: ITransaction['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'PROCESSING':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: ITransaction['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ITransaction['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleViewDetails = (transaction: ITransaction) => {
    setSelectedTransaction(transaction);
    setDetailsModalOpen(true);
  };

  const columns = [
    {
      key: "provider_transaction_id",
      label: "Transaction ID",
      render: (value: number) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    // {
    //   key: "transaction_reference",
    //   label: "Reference",
    //   render: (value: string) => (
    //     <span className="font-mono text-xs text-gray-500">{value.slice(0, 8)}...</span>
    //   )
    // },
    {
      key: "amount",
      label: "Amount",
      render: (value: string | number, row: ITransaction) => {
        const amount = typeof value === 'string' ? parseFloat(value) : value;
        return (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400" />
            <span className={`font-semibold ${row.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-700'}`}>
              {row.currency} {amount.toLocaleString()}
            </span>
          </div>
        );
      }
    },
    {
      key: "payment_method",
      label: "Payment Method",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      key: "phone_number",
      label: "Phone Number",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value: ITransaction['status']) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(value)}`}>
            {getStatusLabel(value)}
          </span>
        </div>
      )
    },
    {
      key: "created_at",
      label: "Date",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: "employee",
      label: "Cashier",
      render: (value: ITransaction['employee']) => (
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{value?.firstName} {value?.lastName}</span>
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: ITransaction) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm">View Details</span>
        </button>
      )
    }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Transactions</h2>
      </div>

      <CustomTable
        columns={columns}
        data={transactions}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        visible={detailsModalOpen}
        transaction={selectedTransaction}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        onRefresh={refresh}
      />
    </div>
  );
};

export default TransactionsTable;