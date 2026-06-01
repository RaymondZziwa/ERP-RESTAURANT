// TransactionDetailsModal.tsx
import React from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  CreditCard,
  FileText,
  Copy,
  Info,
} from 'lucide-react';
import { formatDate } from '../../../libs/dateFormatter';
import type { ITransaction } from '.';

interface TransactionDetailsModalProps {
  visible: boolean;
  transaction: ITransaction | null;
  onClose: () => void;
  onRefresh?: () => void;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  visible,
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const getStatusIcon = (status: ITransaction['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'PROCESSING':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
    console.log(`Copied ${label}: ${text}`);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getStatusIcon(transaction.status)}
                <h2 className="text-xl font-semibold text-gray-800">Transaction Details</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Status Badge */}
              <div className="flex justify-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeClass(transaction.status)}`}>
                  {getStatusIcon(transaction.status)}
                  <span>{getStatusLabel(transaction.status)}</span>
                </div>
              </div>

              {/* Transaction Information */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <h3 className="font-semibold text-gray-800">Transaction Information</h3>
                </div>
                <div className="space-y-2 pl-6">
                  
                  
                  {transaction.provider_transaction_id && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-sm font-medium text-gray-500">Transaction ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 font-mono">{transaction.provider_transaction_id}</span>
                        <button
                          onClick={() => copyToClipboard(transaction.provider_transaction_id, "Provider Transaction ID")}
                          className="text-gray-400 hover:text-teal-600 transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-teal-600" />
                  <h3 className="font-semibold text-gray-800">Payment Details</h3>
                </div>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Amount</span>
                    <span className="text-sm font-semibold text-teal-600">
                      {transaction.currency} {typeof transaction.amount === 'string' ? parseFloat(transaction.amount).toLocaleString() : transaction.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Payment Method</span>
                    <span className="text-sm text-gray-900">{transaction.payment_method.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Provider</span>
                    <span className="text-sm text-gray-900">{transaction.provider}</span>
                  </div>
                  {transaction.provider_mode && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-sm font-medium text-gray-500">Provider Mode</span>
                      <span className="text-sm text-gray-900">{transaction.provider_mode}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Phone Number</span>
                    <span className="text-sm text-gray-900">{transaction.phone_number}</span>
                  </div>
                </div>
              </div>

              {/* Time Information */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <h3 className="font-semibold text-gray-800">Time Information</h3>
                </div>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Initiated At</span>
                    <span className="text-sm text-gray-900">{formatDate(transaction.transaction_initiated_at)}</span>
                  </div>
                  {transaction.transaction_completed_at && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-sm font-medium text-gray-500">Completed At</span>
                      <span className="text-sm text-gray-900">{formatDate(transaction.transaction_completed_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Created At</span>
                    <span className="text-sm text-gray-900">{formatDate(transaction.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Updated At</span>
                    <span className="text-sm text-gray-900">{formatDate(transaction.updated_at)}</span>
                  </div>
                  {transaction.webhook_received_at && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-sm font-medium text-gray-500">Webhook Received At</span>
                      <span className="text-sm text-gray-900">{formatDate(transaction.webhook_received_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-teal-600" />
                  <h3 className="font-semibold text-gray-800">Additional Information</h3>
                </div>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Description</span>
                    <span className="text-sm text-gray-900">{transaction.description}</span>
                  </div>
                  {transaction.notes && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-sm font-medium text-gray-500">Notes</span>
                      <span className="text-sm text-gray-900">{transaction.notes}</span>
                    </div>
                  )}
                  {transaction.event_type && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-sm font-medium text-gray-500">Event Type</span>
                      <span className="text-sm text-gray-900">{transaction.event_type}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cashier Information */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-teal-600" />
                  <h3 className="font-semibold text-gray-800">Cashier Information</h3>
                </div>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-gray-500">Cashier</span>
                    <span className="text-sm text-gray-900">
                      {`${transaction.employee?.firstName || ''} ${transaction.employee?.lastName || ''}`.trim() || 'N/A'}
                    </span>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionDetailsModal;