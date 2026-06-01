// components/restaurant/PendingOrders.tsx
import { useRef, useState } from 'react';
import { FaEye, FaPrint } from 'react-icons/fa';
import CustomTable from '../../../custom/table/customTable';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import usePendingOrders from '../../../hooks/sales/usePendingOrders';
import type { IBill } from '../../../redux/types/sales';

const PendingOrders = () => {
  const { data: pendingOrders, refresh, isLoading: isFetching } = usePendingOrders();
  const [selectedOrder, setSelectedOrder] = useState<IBill | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // React-to-print setup - CORRECTED VERSION
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${selectedOrder?.id || 'order'}`,
    onPrintError: (error) => {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    },
  });

  // Helper function to format currency
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `UGX ${numAmount.toLocaleString()}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'bg-green-100 text-green-800';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNPAID':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return 'Paid';
      case 'PARTIALLY_PAID':
        return 'Partial';
      case 'UNPAID':
        return 'Unpaid';
      default:
        return status;
    }
  };

  // Handle view order details
  const handleViewOrder = (order: IBill) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  // Handle print receipt
  const handlePrintReceipt = (order: IBill) => {
    setSelectedOrder(order);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  // Table columns configuration
  const columns = [
    { key: 'tableNumber', label: 'Table', sortable: true, filterable: true },
    { key: 'items', label: 'Items', sortable: false, filterable: false },
    { key: 'total', label: 'Total (UGX)', sortable: true, filterable: false },
    { key: 'balance', label: 'Balance (UGX)', sortable: true, filterable: false },
    { key: 'status', label: 'Status', sortable: true, filterable: true },
    { key: 'createdAt', label: 'Date', sortable: true, filterable: false },
    { key: 'actions', label: 'Actions', sortable: false, filterable: false },
  ];

  const tableData = pendingOrders?.map(order => {
    const totalAmount = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
    const balanceAmount = typeof order.balance === 'string' ? parseFloat(order.balance) : order.balance;
    const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    
    return {
      tableNumber: order.table?.number || order.tableId,
      items: `${itemCount} item${itemCount !== 1 ? 's' : ''}`,
      total: totalAmount.toLocaleString(),
      balance: balanceAmount.toLocaleString(),
      status: (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      ),
      createdAt: formatDate(order.createdAt),
      actions: (
        <div className="flex gap-3">
          {/* View Button */}
          <div className="relative group">
            <button
              className="text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => handleViewOrder(order)}
            >
              <FaEye />
            </button>
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              View Details
            </span>
          </div>

          {/* Print Button */}
          <div className="relative group">
            <button
              className="text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => handlePrintReceipt(order)}
            >
              <FaPrint />
            </button>
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Print Receipt
            </span>
          </div>
        </div>
      )
    };
  }) || [];

  // Receipt content component
  const ReceiptContent = () => {
    if (!selectedOrder) return null;
    
    const totalAmount = typeof selectedOrder.total === 'string' ? parseFloat(selectedOrder.total) : selectedOrder.total;
    const balanceAmount = typeof selectedOrder.balance === 'string' ? parseFloat(selectedOrder.balance) : selectedOrder.balance;
    const paidAmount = totalAmount - balanceAmount;
    
    return (
      <div ref={receiptRef} style={{ padding: '20px', fontFamily: 'monospace', width: '350px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3>RESTAURANT RECEIPT</h3>
          <p>Table {selectedOrder.table?.number || selectedOrder.tableId}</p>
          <p>Order #{selectedOrder.id}</p>
          <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
        {selectedOrder.items?.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>{item.quantity}x {item.name}</span>
            <span>UGX {(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <strong>Total</strong>
          <strong>UGX {totalAmount.toLocaleString()}</strong>
        </div>
        {paidAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Amount Paid</span>
            <span>UGX {paidAmount.toLocaleString()}</span>
          </div>
        )}
        {balanceAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Balance</span>
            <span>UGX {balanceAmount.toLocaleString()}</span>
          </div>
        )}
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Payment Method</span>
          <span>{selectedOrder.paymentMethod || 'Cash'}</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
          <p>Thank you for dining with us!</p>
          <p>Please come again</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pending Orders</h2>
      </div>

      {isFetching && !pendingOrders?.length ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading pending orders...</p>
          </div>
        </div>
      ) : (
        <CustomTable columns={columns} data={tableData} pageSize={10} />
      )}

      {/* Hidden receipt content for printing */}
      <div style={{ display: 'none' }}>
        <ReceiptContent />
      </div>

      {/* View Order Details Modal */}
      {selectedOrder && showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Order Details #{selectedOrder.id}
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Order Information */}
            <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="font-semibold">Table:</span>{' '}
                {selectedOrder.table?.number || selectedOrder.tableId}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div>
                <span className="font-semibold">Sale Status:</span> {selectedOrder.saleStatus}
              </div>
              <div>
                <span className="font-semibold">Total:</span> {formatCurrency(selectedOrder.total)}
              </div>
              <div>
                <span className="font-semibold">Balance:</span> {formatCurrency(selectedOrder.balance)}
              </div>
              <div>
                <span className="font-semibold">Served By:</span> {selectedOrder.employee.lastName}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}
              </div>
              {selectedOrder.notes && (
                <div className="col-span-2 md:col-span-3">
                  <span className="font-semibold">Notes:</span> {selectedOrder.notes}
                </div>
              )}
            </div>

            {/* Items Table */}
            <h4 className="text-lg font-semibold mb-3">Order Items</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={`${item.menuItemId}-${idx}`} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right">
                      Total:
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(selectedOrder.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment History */}
            {selectedOrder.SalePayments && selectedOrder.SalePayments.length > 0 && (
              <>
                <h4 className="text-lg font-semibold mb-3">Payment History</h4>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Method</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.SalePayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">
                            {new Date(payment.createdAt).toLocaleString()}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{payment.paymentMethod}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{payment.referenceId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handlePrintReceipt(selectedOrder)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <FaPrint /> Print Receipt
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingOrders;