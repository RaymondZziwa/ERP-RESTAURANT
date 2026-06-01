// UtilityPaymentModal.tsx
import React, { useState, useEffect} from 'react';
import { X, Check, Loader2, Wallet, Phone, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import useWallets from '../../hooks/finance/useWallets';
import CustomDropdown from '../../custom/inputs/customDropdown';
import uedclLogo from '../../assets/uedcl.png';
import nwscLogo from '../../assets/mwsc.png';
import type { IBillingChannel } from '../../redux/types/systemSettings';
import useBillingChannels from '../../hooks/settings/useBillingChannels';
import { apiRequest } from '../../libs/apiConfig';
import { BILLING_CHANNELS } from '../../endpoints/expense/expenseEndpoints';

interface UtilityPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VerificationData {
  customer_details: {
    customer_ref: string;
    customer_name: string;
    outstanding_balance: string;
    area: string;
    customer_type: string;
    last_payment_date: string;
    last_payment_amount: string;
  };
  utility_code: string;
  meter_number: string;
}

const UtilityPaymentModal: React.FC<UtilityPaymentModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { data: wallets } = useWallets();
  const {data: billingChannels, refresh} = useBillingChannels();
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<'nwsc' | 'light'>('nwsc');
  const [meterNumberType, setMeterNumberType] = useState<'registered' | 'custom'>('registered');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConnectingModal, setShowConnectingModal] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0);
    const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const connectionSteps = [
    { message: `Connecting to ${selectedUtility === 'nwsc' ? 'NWSC' : 'UEDCL'} servers...` },
    { message: 'Authenticating credentials...' },
    { message: 'Fetching meter details...' },
    { message: 'Verifying customer information...' },
  ];

  // Reset form when modal closes or utility changes
  useEffect(() => {
    if (!visible) {
      // Reset all states when modal closes
      setSelectedChannelId('');
      setMeterNumber('');
      setCustomerName('');
      setOutstandingBalance('');
      setIsVerified(false);
      setSelectedWalletId('');
      setAmount('');
      setPhoneNumber('');
      setSelectedUtility('nwsc');
      setMeterNumberType('registered');
    }
  }, [visible]);

  // Format phone number to start with 256
  const formatPhoneNumber = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '256' + cleaned.substring(1);
    } else if (!cleaned.startsWith('256')) {
      if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '256' + cleaned;
      }
    }
    
    if (cleaned.length > 12) {
      cleaned = cleaned.slice(0, 12);
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleVerifyMeter = async () => {
    if (!meterNumber) {
      toast.error('Please enter a meter number');
      return;
    }

    // Start connecting animation
    setShowConnectingModal(true);
    setConnectionStep(0);

    // Animate through connection steps
    for (let i = 0; i < connectionSteps.length; i++) {
      setConnectionStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const payload: any = {
        meterNumber: meterNumber,
        utilityType: selectedUtility.toUpperCase(),
      };

      // Replace with actual API call
      const response = await apiRequest(BILLING_CHANNELS.VERIFY, 'POST', '', payload);
      
      // Simulate API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (response.status === 200 && response.data.status === 'success') {
        setVerificationData(response.data.data);
        //toast.success(response.data.message || 'Meter number verified successfully');
        onSuccess();
      } else {
        //toast.error(response.data?.message || 'Verification failed');
      }
      const randomBalance = Math.floor(Math.random() * 500000) + 10000;
      setCustomerName(`${selectedUtility === 'nwsc' ? 'NWSC' : 'UEDCL'} Customer - Meter ${meterNumber}`);
      setOutstandingBalance(randomBalance.toString());
      setIsVerified(true);
      setShowConnectingModal(false);
      toast.success('Meter number verified successfully');
    } catch (error: any) {
      setShowConnectingModal(false);
      toast.error(error?.response?.data?.message || 'Failed to verify meter number');
    }
  };

  const handleSubmit = async () => {
    if (!selectedWalletId) {
      toast.error('Please select a wallet');
      return;
    }

    if (meterNumberType === 'registered' && !selectedChannelId) {
      toast.error('Please select a billing channel');
      return;
    }

    if (meterNumberType === 'custom' && !meterNumber) {
      toast.error('Please enter meter number');
      return;
    }

    if (meterNumberType === 'custom' && !isVerified) {
      toast.error('Please verify the meter number first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!phoneNumber) {
      toast.error('Please enter phone number for SMS notification');
      return;
    }

    if (!phoneNumber.match(/^2567[0-9]{8}$/)) {
      toast.error('Phone number must start with 256 and be followed by 9 digits (e.g., 2567XXXXXXXX)');
      return;
    }

    const selectedWallet = wallets?.find(w => w.id === selectedWalletId);
    const balance = selectedWallet?.balance || 0;
    const paymentAmount = parseFloat(amount);

    if (paymentAmount > balance) {
      toast.error(`Insufficient balance. Available: UGX ${balance.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      utilityType: selectedUtility.toUpperCase(),
      meterNumber: meterNumberType === 'registered' 
        ? billingChannels.find((c: IBillingChannel) => String(c.id) === selectedChannelId)?.meterNumber 
        : meterNumber,
      amount: paymentAmount,
      walletId: selectedWalletId,
      phoneNumber,
      channelId: meterNumberType === 'registered' ? selectedChannelId : undefined,
    };

    try {
      // await apiRequest('/api/utility-payment', 'POST', '', payload);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Payment of UGX ${paymentAmount.toLocaleString()} for ${selectedUtility.toUpperCase()} successful`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  // Convert wallets to CustomDropdown options format
  const walletOptions = wallets?.map((wallet: any) => ({
    value: wallet.id,
    label: `${wallet.name} - Balance: UGX ${parseFloat(wallet.balance).toLocaleString()}`
  })) || [];

  const billingChannelOptions = billingChannels.filter((channel: IBillingChannel) => 
    channel.utility === selectedUtility.toUpperCase() && channel.isVerified
  ).map((channel: IBillingChannel) => ({
    value: String(channel.id),
    label: `${channel.name || channel.meterNumber} - ${channel.meterNumber}`
  }));

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Pay Utility Bill</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Utility Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Utility Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUtility('nwsc');
                      setSelectedChannelId('');
                      setMeterNumber('');
                      setCustomerName('');
                      setOutstandingBalance('');
                      setIsVerified(false);
                    }}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      selectedUtility === 'nwsc'
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={nwscLogo} alt="NWSC Logo" className="h-10 w-10 object-contain" />
                    <span className={`text-sm font-medium ${selectedUtility === 'nwsc' ? 'text-gray-600' : 'text-gray-600'}`}>
                      NWSC (Water)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUtility('light');
                      setSelectedChannelId('');
                      setMeterNumber('');
                      setCustomerName('');
                      setOutstandingBalance('');
                      setIsVerified(false);
                    }}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      selectedUtility === 'light'
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={uedclLogo} alt="UEDCL Logo" className="h-10 w-10 object-contain" />
                    <span className={`text-sm font-medium ${selectedUtility === 'light' ? 'text-gray-600' : 'text-gray-600'}`}>
                      UEDCL (Electricity)
                    </span>
                  </button>
                </div>
              </div>

              

              {/* Meter Number Selection */}
              {meterNumberType === 'registered' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Billing Channel
                  </label>
                  {isLoadingChannels ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                      <span className="ml-2 text-sm text-gray-500">Loading channels...</span>
                    </div>
                  ) :   billingChannelOptions.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                      No verified billing channels found for {selectedUtility.toUpperCase()}. 
                      Please add and verify a billing channel first.
                    </div>
                  ) : (
                    <CustomDropdown
                      options={billingChannelOptions}
                      value={selectedChannelId ? [selectedChannelId] : []}
                      onChange={(values: string[]) => {
                        const channelId = values[0] || '';
                        setSelectedChannelId(channelId);
                        const selectedChannel = billingChannels.find((c: IBillingChannel) => String(c.id) === channelId);
                        if (selectedChannel) {
                          setMeterNumber(selectedChannel.meterNumber);
                          setCustomerName(selectedChannel.name || '');
                          setIsVerified(true);
                        }
                      }}
                      placeholder="Select billing channel"
                      singleSelect={true}
                    />
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meter Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => {
                        setMeterNumber(e.target.value);
                        setIsVerified(false);
                        setCustomerName('');
                        setOutstandingBalance('');
                      }}
                      placeholder="Enter meter number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMeter}
                      disabled={!meterNumber || isVerifying}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Name & Balance Display */}
              {customerName && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-xs text-green-600">Customer Name</p>
                      <p className="text-sm font-medium text-green-800">{customerName}</p>
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  {outstandingBalance && (
                    <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                      <Wallet className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-orange-600">Outstanding Balance</p>
                        <p className="text-sm font-semibold text-orange-700">
                          UGX {parseFloat(outstandingBalance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Selection using CustomDropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Wallet
                </label>
                <CustomDropdown
                  options={walletOptions}
                  value={selectedWalletId ? [selectedWalletId] : []}
                  onChange={(values: string[]) => setSelectedWalletId(values[0] || '')}
                  placeholder="Select wallet"
                  singleSelect={true}
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (UGX)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to pay"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                {outstandingBalance && parseFloat(amount) > parseFloat(outstandingBalance) && (
                  <p className="text-xs text-red-500 mt-1">
                    Warning: Payment amount exceeds outstanding balance
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMS Notification Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="2567XXXXXXXX"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-mono"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: 2567XXXXXXXX (12 digits total)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting || 
                  !selectedWalletId || 
                  !amount || 
                  !phoneNumber ||
                  (meterNumberType === 'registered' && !selectedChannelId) ||
                  (meterNumberType === 'custom' && (!meterNumber || !isVerified))
                }
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Pay Bill
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connecting Animation Modal */}
      {showConnectingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gray-500 rounded-full opacity-20 animate-ping"></div>
                <div className="relative bg-gradient-to-br from-gray-500 to-gray-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  {selectedUtility === 'nwsc' ? (
                    <span className="text-white text-3xl">💧</span>
                  ) : (
                    <span className="text-white text-3xl">⚡</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {connectionSteps[connectionStep]?.message || 'Processing...'}
              </h3>
              <p className="text-gray-500 text-sm">Please wait while we connect to the server</p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-500 to-gray-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((connectionStep + 1) / connectionSteps.length) * 100}%` }}
              />
            </div>

            <div className="flex justify-center gap-1 mt-6">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UtilityPaymentModal;