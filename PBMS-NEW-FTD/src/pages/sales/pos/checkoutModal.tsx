// CheckoutModal.tsx (corrected)
import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUserPlus, FaPrint, FaCheck, FaSpinner } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import useClients from '../../../hooks/sales/useClients';
import type { ICartItem, IPaymentMethod } from '../../../redux/types/sales';
import { PrintableContent } from './receipt';
import CustomDropdown from '../../../custom/inputs/customDropdown';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { toast } from 'sonner';
import { apiRequest } from '../../../libs/apiConfig';
import { SALESENDPOINTS } from '../../../endpoints/sales/salesEndpoints';
import PaymentWaitingModal from './paymentWaitingModal';

interface CheckoutModalProps {
  visible: boolean;
  cart: ICartItem[];
  total: number;
  onClose: () => void;
  onCompleteSale: () => void;
}

// Map the enum values to display labels
const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MTN_MOMO', label: 'MTN Momo' },
  { value: 'AIRTEL_MOMO', label: 'Airtel Momo' },
  { value: 'CARD', label: 'Card' },
  { value: 'PROF_MOMO', label: 'Prof Momo' }
];

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  cart,
  total,
  onClose,
  onCompleteSale,
}) => {
  const { data: clients } = useClients();
  const user = useSelector((state: RootState) => state.userAuth.data);

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'FULLY_PAID' | 'UNPAID' | 'PARTIALLY_PAID'>('FULLY_PAID');
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([
    { type: 'CASH' as const, amount: total }
  ]);
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState(total);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Loading state for the complete sale button
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Payment waiting modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${new Date().getTime()}`,
  });

  const balance = total - amountPaid;

  // Format phone number to always start with +256
  const formatPhoneNumber = (number: string) => {
    if (!number) return '';
    const cleanNumber = number.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
      return '+256' + cleanNumber.substring(1);
    }
    
    if (cleanNumber.startsWith('256') && cleanNumber.length === 12) {
      return '+' + cleanNumber;
    }
    
    if (number.startsWith('+256')) {
      return number;
    }
    
    if (cleanNumber.length === 9) {
      return '+256' + cleanNumber;
    }
    
    return number;
  };

  // Check if there are mobile money payments
  const hasMobileMoneyPayments = () => {
    return paymentMethods.some(method => 
      (method.type === 'AIRTEL_MOMO' || method.type === 'MTN_MOMO') && method.amount > 0
    );
  };

  // Get selected customer name for receipt
  const selectedCustomerName = (() => {
    if (!selectedCustomer || !clients) return 'Walk-in Customer';
    const client = clients.find(c => c.id === selectedCustomer);
    return client ? `${client.firstName || ''} ${client.lastName || ''}` : 'Walk-in Customer';
  })();

  // Format payment method for receipt
  const getPaymentMethodForReceipt = () => {
    if (paymentMethods.length === 0) return 'UNPAID';
    if (paymentMethods.length === 1) {
      const method = paymentMethods[0];
      const methodOption = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method.type);
      return methodOption ? methodOption.label : method.type;
    }
    return 'Multiple Methods';
  };

  const getTransactionIdForReceipt = () => {
    const momoMethod = paymentMethods.find(method => 
        method.type === 'MTN_MOMO' || method.type === 'AIRTEL_MOMO'
    );
    return momoMethod?.transactionId || '';
  };

  useEffect(() => {
    if (paymentStatus === 'FULLY_PAID') {
      setAmountPaid(total);
      if (paymentMethods.length === 0) {
        setPaymentMethods([{ type: 'CASH', amount: total }]);
      } else if (paymentMethods.length === 1) {
        setPaymentMethods([{ ...paymentMethods[0], amount: total }]);
      }
    } else if (paymentStatus === 'UNPAID') {
      setAmountPaid(0);
      setPaymentMethods([]);
    }
  }, [paymentStatus, total]);

  // Calculate total from payment methods
  useEffect(() => {
    const paymentTotal = paymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
    setAmountPaid(paymentTotal);
  }, [paymentMethods]);

  const handlePaymentMethodChange = (index: number, field: keyof IPaymentMethod, value: any) => {
    setPaymentMethods(prev => prev.map((method, i) => 
      i === index ? { ...method, [field]: value } : method
    ));
  };

  const addPaymentMethod = () => {
    if (paymentMethods.length >= 3) {
      toast.error('Maximum of 3 payment methods allowed');
      return;
    }
    setPaymentMethods(prev => [...prev, { type: 'CASH' as const, amount: 0 }]);
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmountPaidChange = (amount: number) => {
    setAmountPaid(amount);
    if (paymentMethods.length === 1) {
      setPaymentMethods([{ ...paymentMethods[0], amount }]);
    }
  };

  // Check if payment method requires transaction ID
  const requiresTransactionId = (methodType: string) => {
    return methodType === 'MTN_MOMO' || methodType === 'AIRTEL_MOMO';
  };

  const validatePaymentMethods = () => {
    if (paymentMethods.some(method => method.amount <= 0)) {
      toast.error('Please enter valid amounts for all payment methods');
      return false;
    }

    const paymentTotal = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    if (paymentTotal !== amountPaid) {
      toast.error('Payment methods total must match amount paid');
      return false;
    }

    if (hasMobileMoneyPayments() && !phoneNumber.trim()) {
      toast.error('Please enter a phone number for mobile money payments');
      return false;
    }

    if (hasMobileMoneyPayments() && phoneNumber.trim()) {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      if (!formattedNumber.startsWith('+256') || formattedNumber.length !== 13) {
        toast.error('Please enter a valid phone number (e.g., 07xx... or +256xxx...)');
        return false;
      }
    }

    return true;
  };

  // Handle payment completion after successful webhook
  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setPendingReference(null);
    
    // Print receipt and complete sale
    handlePrint();
    onCompleteSale();
    
    // Reset form
    setSelectedCustomer('');
    setPaymentStatus('FULLY_PAID');
    setPaymentMethods([]);
    setNotes('');
    setAmountPaid(0);
    setPhoneNumber('');
    setIsSubmitting(false);
  };

  // Handle payment failure
  const handlePaymentFailed = () => {
    setShowPaymentModal(false);
    setPendingReference(null);
    setIsSubmitting(false);
    
    toast.error('Payment failed. Please try again or use another payment method.');
  };

  const handleCompleteSale = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    
    if (paymentStatus === 'PARTIALLY_PAID' && amountPaid <= 0) {
      toast.error('Please enter a valid amount paid');
      return;
    }

    if (paymentStatus !== 'UNPAID' && !validatePaymentMethods()) {
      return;
    }

    setIsSubmitting(true);

    const storedStore = localStorage.getItem('posStore');
    const storeId = storedStore ? JSON.parse(storedStore).storeId : null;

    // Calculate mobile money charges (8% only on mobile money payments)
    const chargePercentage = 0.08;
    const mobileMoneyMethods = paymentMethods.filter(method => 
      (method.type === 'AIRTEL_MOMO' || method.type === 'MTN_MOMO') && method.amount > 0
    );
    const mobileMoneyTotal = mobileMoneyMethods.reduce((sum, method) => sum + method.amount, 0);
    const charges = mobileMoneyTotal * chargePercentage;
    const totalWithCharges = total + charges;

    const checkoutData: any = {
      customerId: selectedCustomer ? Number(selectedCustomer) : undefined,
      status: paymentStatus,
      paymentMethods: paymentStatus === 'UNPAID' ? [] : paymentMethods.filter(method => method.amount > 0).map(method => ({
        type: method.type,
        amount: method.amount
      })),
      notes,
      total,
      balance,
      items: cart.map(item => ({
        id: Number(item.id || 0),
        categoryId: Number(item.category?.id || 0),
        name: item.name || '',
        price: (item.price || 0).toString(),
        barcode: (item.barcode || '').toString(),
        category: {
          id: Number(item.category?.id || 0),
          name: item.category?.name || ''
        },
        quantity: item.quantity || 0,
        discount: item.discount || 0,
        total: item.total || 0,
        unitId: item.unitId || 0
      })),
      storeId: Number(storeId),
      servedBy: user?.id ? Number(user.id) : 0
    };

    if (mobileMoneyTotal > 0) {
      checkoutData.totalWithCharges = totalWithCharges;
    }

    if (hasMobileMoneyPayments() && phoneNumber.trim()) {
      checkoutData.phoneNumber = formatPhoneNumber(phoneNumber);
    }

    if (!checkoutData.customerId) {
      toast.error('Please select a customer');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest(SALESENDPOINTS.POS.complete_sale, 'POST', '', checkoutData);

      console.log('Complete sale response:', res);

      // Check if this is a mobile money payment that needs confirmation
      // Look for reference in different possible locations in the response
      const reference = res?.data?.transaction?.reference || 
                       res?.data?.reference || 
                       res?.transaction?.reference ||
                       res?.reference;
      
      if (hasMobileMoneyPayments() && reference) {
        // Store reference in localStorage for polling
        localStorage.setItem('PendingReference', reference);
        setPendingReference(reference);
        
        // Show payment waiting modal
        setShowPaymentModal(true);
        
        // Don't close modal or reset form yet - wait for payment confirmation
        // The payment waiting modal will handle polling and completion
        
      } else if (hasMobileMoneyPayments() && !reference) {
        // Mobile money payment but no reference returned - show error
        toast.error('Failed to initiate mobile money payment. Please try again.');
        setIsSubmitting(false);
      } else {
        // For cash payments, complete immediately
        handlePrint();
        onCompleteSale();
        
        // Reset form
        setSelectedCustomer('');
        setPaymentStatus('FULLY_PAID');
        setPaymentMethods([]);
        setNotes('');
        setAmountPaid(0);
        setPhoneNumber('');
        setIsSubmitting(false);
      }
      
    } catch (error: any) {
      console.error('Complete sale error:', error);
      toast.error(error?.response?.data?.message || 'An error occurred while processing the sale.');
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  if (!user) {
    console.error('CheckoutModal: user data not available');
    return null;
  }

  return (
    <>
      {/* Payment Waiting Modal */}
      <PaymentWaitingModal
        visible={showPaymentModal}
        reference={pendingReference}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingReference(null);
          setIsSubmitting(false);
        }}
        onPaymentComplete={handlePaymentComplete}
        onPaymentFailed={handlePaymentFailed}
      />

      {/* Main Checkout Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="overflow-auto max-h-[70vh] p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Customer & Payment Info */}
              <div className="space-y-6">
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  <div className="flex gap-2">
                    <CustomDropdown
                      options={[
                        ...(clients?.map(client => ({
                          value: client.id,
                          label: `${client.firstName || ''} ${client.lastName || ''} - ${client.phone || ''}`
                        })) || [])
                      ]}
                      value={[selectedCustomer]}
                      onChange={(selectedValues) => setSelectedCustomer(selectedValues[0] || '')}
                      placeholder="Select customer..."
                      searchPlaceholder="Search customers..."
                      singleSelect={true}
                      maxHeight={200}
                    />
                    <button
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center transition-colors"
                    >
                      <FaUserPlus className="mr-2" />
                      New
                    </button>
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'FULLY_PAID', label: 'FULLY PAID' },
                      { value: 'PARTIALLY_PAID', label: 'PARTIAL' },
                      { value: 'UNPAID', label: 'UNPAID' }
                    ].map(status => (
                      <button
                        key={status.value}
                        onClick={() => setPaymentStatus(status.value as any)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          paymentStatus === status.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Paid */}
                {paymentStatus !== 'UNPAID' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Paid (UGX)
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => handleAmountPaidChange(Number(e.target.value))}
                      disabled={paymentStatus === 'FULLY_PAID'}
                      className="w-full p-3 border border-gray-300 rounded-lg text-lg font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                      min="0"
                      max={total}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Total due: {total.toLocaleString()} UGX
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                {paymentStatus !== 'UNPAID' && amountPaid > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Methods
                      </label>
                      {/* {paymentMethods.length < 3 && (
                        <button
                          onClick={addPaymentMethod}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Add Method
                        </button>
                      )} */}
                    </div>
                    
                    <div className="space-y-3">
                      {paymentMethods.map((method, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <CustomDropdown
                              options={PAYMENT_METHOD_OPTIONS}
                              value={[method.type]}
                              onChange={(selectedValues) => handlePaymentMethodChange(index, 'type', selectedValues[0] || 'CASH')}
                              placeholder="Select payment method..."
                              searchPlaceholder="Search payment methods..."
                              singleSelect={true}
                              maxHeight={200}
                            />
                          </div>
                          
                          <input
                            type="number"
                            value={method.amount}
                            onChange={(e) => handlePaymentMethodChange(index, 'amount', Number(e.target.value))}
                            className="w-32 p-2 border border-gray-300 rounded-lg"
                            placeholder="Amount"
                            min="0"
                            max={amountPaid}
                          />
                          
                          {/* {requiresTransactionId(method.type) && (
                            <input
                              type="text"
                              value={method.transactionId || ''}
                              onChange={(e) => handlePaymentMethodChange(index, 'transactionId', e.target.value)}
                              className="flex-1 p-2 border border-gray-300 rounded-lg"
                              placeholder="Transaction ID"
                            />
                          )} */}
                          
                          {paymentMethods.length > 1 && (
                            <button
                              onClick={() => removePaymentMethod(index)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                              title="Remove payment method"
                            >
                              <FaTimes size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {paymentMethods.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Total from payment methods: {paymentMethods.reduce((sum, method) => sum + method.amount, 0).toLocaleString()} UGX
                      </div>
                    )}
                  </div>
                )}

                {/* Phone Number for Mobile Money */}
                {hasMobileMoneyPayments() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number for Mobile Money
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number (e.g., 07xx... or +256xxx...)"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Phone number will be formatted to +256 format
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about this sale..."
                  />
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                
                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm pb-2 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium">
                          <span className="text-gray-600">{item.quantity}x </span>
                          {item.name}
                        </div>
                        {item.discount > 0 && (
                          <div className="text-red-600 text-xs">
                            Discount: -{item.discount.toLocaleString()} UGX
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {item.total.toLocaleString()} UGX
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.price.toLocaleString()} UGX each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{total.toLocaleString()} UGX</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      {amountPaid.toLocaleString()} UGX
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Balance:</span>
                    <span className={balance === 0 ? 'text-green-600' : 'text-orange-600'}>
                      {balance.toLocaleString()} UGX
                    </span>
                  </div>
                </div>

                {/* Payment Status Summary */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <div className="font-semibold">Payment Status: {paymentStatus.replace('_', ' ')}</div>
                    {paymentStatus !== 'UNPAID' && (
                      <div className="mt-1">
                        Methods: {paymentMethods.map(method => {
                          const methodOption = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method.type);
                          return `${methodOption?.label} (${method.amount.toLocaleString()} UGX)`;
                        }).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <button
              onClick={handlePrint}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              <FaPrint className="mr-2" />
              Print Receipt
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={isSubmitting}
                className={`flex items-center px-6 py-3 rounded-lg transition-colors font-semibold ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Complete Sale
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hidden receipt for printing */}
          <div style={{ display: 'none' }}>
            <div ref={receiptRef}>
              <PrintableContent
                client_names={selectedCustomerName}
                cart={cart}
                total={total}
                status={paymentStatus}
                balance={balance}
                branch={user.branch?.name || 'Unknown Branch'}
                department={user.department?.name || 'Unknown Department'}
                user={user.lastName}
                paymentMethod={getPaymentMethodForReceipt()}
                transactionId={getTransactionIdForReceipt()}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;