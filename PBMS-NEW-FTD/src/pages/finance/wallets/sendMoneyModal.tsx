// SendMoneyModal.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  Smartphone,
  Send,
  Check,
  X
} from 'lucide-react';
import CustomButton from '../../../custom/buttons/customButton';
import CustomTextInput from '../../../custom/inputs/customTextInput';
import { apiRequest } from '../../../libs/apiConfig';
import { TransactionEndpoints } from '../../../endpoints/finance/FinanceEndpoints';
import { v4 as uuidv4 } from 'uuid';

interface IWallet {
  id: number;
  name: string;
  purpose: string;
  balance: string | number;
  isActive: boolean;
  isForSales: boolean;
  isForTickets: boolean;
  canBeDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SendMoneyModalProps {
  visible: boolean;
  wallet: IWallet | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface StatusStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface MobileMoneyStatus {
  status: string;
  message: string;
  data: {
    transaction_id: string;
    reference: string;
    amount: number;
    phone_number: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    provider_reference?: string;
    created_at: string;
  };
}

const SendMoneyModal: React.FC<SendMoneyModalProps> = ({
  visible,
  wallet,
  onClose,
  onSuccess,
}) => {
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Status steps configuration
  const statusSteps: StatusStep[] = [
    {
      id: 'submitted',
      title: 'Request Submitted',
      description: 'Your payment request has been received',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 'processing',
      title: 'Processing',
      description: 'Verifying transaction details',
      icon: <Loader2 className="h-5 w-5" />,
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money Processing',
      description: 'Awaiting confirmation from mobile money provider',
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      id: 'completed',
      title: 'Completed',
      description: 'Payment sent successfully!',
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setPhoneInput('');
      setAmount('');
      setDescription('');
      setShowStatusModal(false);
      setCurrentStep(0);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [visible]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  /**
   * Convert any phone number format to API format (+256XXXXXXXXX)
   * Accepts: 0707090690, 256707090690, +256701234567, 701234567
   * Returns: +256701234567
   */
  const formatPhoneForAPI = (value: string): string => {
    // Remove all non-digits
    let cleaned = value.replace(/\D/g, '');
    
    if (!cleaned) return '';
    
    // If starts with 0 (local format like 0707090690)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '256' + cleaned.substring(1);
    }
    // If it's a 9-digit number starting with 7
    else if (cleaned.length === 9 && cleaned.startsWith('7')) {
      cleaned = '256' + cleaned;
    }
    // If it's a 12-digit number already starting with 256, keep it
    else if (cleaned.length === 12 && cleaned.startsWith('256')) {
      cleaned = cleaned;
    }
    // If it's a 10-digit number starting with 07
    else if (cleaned.length === 10 && cleaned.startsWith('07')) {
      cleaned = '256' + cleaned.substring(1);
    }
    
    // Add + prefix for API
    return `+${cleaned}`;
  };

  /**
   * Format phone number for display (readable format)
   * Example: +256 701 234 567
   */
  const formatPhoneForDisplay = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 12) {
      const countryCode = cleaned.slice(0, 3);
      const part1 = cleaned.slice(3, 6);
      const part2 = cleaned.slice(6, 9);
      const part3 = cleaned.slice(9, 12);
      return `+${countryCode} ${part1} ${part2} ${part3}`.trim();
    }
    return value;
  };

  const handlePhoneChange = (value: string) => {
    // Store raw input
    setPhoneInput(value);
  };

  const getDisplayPhone = (): string => {
    if (!phoneInput) return '';
    const apiFormat = formatPhoneForAPI(phoneInput);
    return formatPhoneForDisplay(apiFormat);
  };

  const getRawPhoneForAPI = (): string => {
    if (!phoneInput) return '';
    return formatPhoneForAPI(phoneInput);
  };

  const getWalletBalance = (): number => {
    if (!wallet) return 0;
    return typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;
  };

  const handleAmountChange = (value: string) => {
    let cleaned = value.replace(/[^0-9.]/g, '');
    const decimalCount = (cleaned.match(/\./g) || []).length;
    if (decimalCount > 1) return;
    
    const numAmount = parseFloat(cleaned);
    const balance = getWalletBalance();
    
    if (!isNaN(numAmount) && numAmount > balance) {
      setAmount(balance.toString());
      toast.warning(`Amount cannot exceed available balance of UGX ${balance.toLocaleString()}`);
      return;
    }
    
    setAmount(cleaned);
  };

  const validateForm = (): boolean => {
    const balance = getWalletBalance();
    const minAmount = 500;
    const maxAmount = 10000000;
    const numAmount = parseFloat(amount);
    const rawPhone = getRawPhoneForAPI();

    if (!phoneInput || phoneInput.trim() === '') {
      toast.error('Please enter a phone number');
      return false;
    }

    // Validate phone number format (should be +256XXXXXXXXX)
    if (!rawPhone.match(/^\+256[0-9]{9}$/)) {
      toast.error('Please enter a valid phone number (e.g., 0707090690 or 256707090690)');
      return false;
    }

    if (!amount || amount === '') {
      toast.error('Please enter an amount');
      return false;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return false;
    }

    if (numAmount < minAmount) {
      toast.error(`Minimum amount is UGX ${minAmount.toLocaleString()}`);
      return false;
    }

    if (numAmount > maxAmount) {
      toast.error(`Maximum amount is UGX ${maxAmount.toLocaleString()}`);
      return false;
    }

    if (numAmount > balance) {
      toast.error(`Amount exceeds available balance. Maximum is UGX ${balance.toLocaleString()}`);
      return false;
    }

    if (!description || description.trim() === '') {
      toast.error('Please enter a description');
      return false;
    }

    return true;
  };

  const updateStepProgress = (stepIndex: number) => {
    setCurrentStep(stepIndex + 1);
  };

  const pollPaymentStatus = async (reference: string): Promise<void> => {
    try {
      const response = await apiRequest<MobileMoneyStatus>(
        TransactionEndpoints.checkMobileMoneyStatus(reference),
        'GET',
        ''
      );

      if (response.status === 'success') {
        const paymentStatus = response.data.status;
        
        if (paymentStatus === 'completed') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setCurrentStep(statusSteps.length);
          toast.success('Payment sent successfully!');
          
          setTimeout(() => {
            setShowStatusModal(false);
            onSuccess();
            onClose();
          }, 2000);
        } else if (paymentStatus === 'failed') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          toast.error('Payment failed. Please contact support.');
          setTimeout(() => {
            setShowStatusModal(false);
          }, 3000);
        } else if (paymentStatus === 'processing') {
          updateStepProgress(2);
        }
      }
    } catch (error) {
      console.error('Error polling payment status:', error);
    }
  };

  const startPolling = (reference: string) => {
    setTransactionReference(reference);
    setShowStatusModal(true);
    setCurrentStep(1);
    
    setTimeout(() => updateStepProgress(0), 1000);
    setTimeout(() => updateStepProgress(1), 2500);
    setTimeout(() => updateStepProgress(2), 4000);
    
    const interval = setInterval(() => {
      pollPaymentStatus(reference);
    }, 3000);
    
    setPollingInterval(interval);
  };

  const handleSendMoney = async () => {
    if (!wallet) {
      toast.error('Wallet not found');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const reference = uuidv4();
      const rawPhone = getRawPhoneForAPI();
      
      const payload = {
        amount: parseFloat(amount),
        phone_number: rawPhone, // This will be +256XXXXXXXXX format
        country: 'UG',
        reference: reference,
        description: description.trim(),
        callback_url: `${window.location.origin}/api/webhooks/mobile-money`,
      };

      const response = await apiRequest(
        TransactionEndpoints.sendMoney,
        'POST',
        '',
        payload
      );

      if (response.status === 200 || response.status === 201) {
        startPolling(reference);
      } else {
        toast.error(response.message || 'Failed to send money');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Status Modal Component
  const StatusModal = () => {
    if (!showStatusModal) return null;

    const amountNum = parseFloat(amount);
    const allStepsCompleted = currentStep === statusSteps.length;
    const displayPhoneNumber = getDisplayPhone();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-6">
            <div className="relative inline-block">
              {allStepsCompleted ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <Send className="h-8 w-8 text-teal-600 animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-4 h-4 bg-teal-500 rounded-full animate-ping"></div>
                  </div>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mt-3">
              {allStepsCompleted ? 'Payment Sent!' : 'Processing Payment'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {allStepsCompleted 
                ? 'Your payment has been sent successfully'
                : 'Please wait while we process your payment'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center mb-4">
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-2xl font-bold text-teal-600">UGX {amountNum.toLocaleString()}</p>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Recipient</p>
              <p className="text-sm font-medium text-gray-700">{displayPhoneNumber}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {statusSteps.map((step, index) => {
              const isStepActive = index < currentStep;
              const isCurrentStep = index === currentStep - 1 && !allStepsCompleted;
              const isStepCompleted = index < currentStep - 1;
              
              return (
                <div key={step.id} className="relative">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isStepCompleted || (isStepActive && !isCurrentStep)
                          ? 'bg-green-500 text-white'
                          : isCurrentStep
                          ? 'bg-teal-500 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isStepCompleted || (isStepActive && !isCurrentStep) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute top-8 left-4 w-0.5 h-8 transition-all duration-300 ${
                          index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        isStepCompleted || isStepActive ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {step.description}
                      </p>
                    </div>
                    {isCurrentStep && (
                      <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {transactionReference && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference:</span>
                <span className="font-mono text-gray-700">{transactionReference.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Description:</span>
                <span className="text-gray-700">{description}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / statusSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {allStepsCompleted && (
            <button
              onClick={() => {
                setShowStatusModal(false);
                onSuccess();
                onClose();
              }}
              className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  };

  const balance = getWalletBalance();
  const minAmount = 500;
  const maxAmount = Math.min(10000000, balance);
  const displayPhoneNumber = getDisplayPhone();

  if (!visible || !wallet) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Send Mobile Money</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            Available Balance: UGX {balance.toLocaleString()}
          </p>

          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="0707090690 or 256707090690"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {displayPhoneNumber && (
                <p className="text-xs text-green-600 mt-1">
                  Will send to: {displayPhoneNumber}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (UGX) *
              </label>
              <CustomTextInput
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Enter amount (Min: UGX ${minAmount.toLocaleString()}, Max: UGX ${maxAmount.toLocaleString()})`}
                min={minAmount}
                max={maxAmount}
                step="100"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Minimum: UGX {minAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Maximum: UGX {maxAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <CustomTextInput
                type="text"
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Enter reason for payment (e.g., Payment for services)"
              />
            </div>

            {/* Quick Amount Buttons */}
            {balance > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select Amount
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[500, 1000, 5000, 10000, 20000, 50000].map((amt) => (
                    amt <= balance && amt <= 10000000 && (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt.toString())}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        UGX {amt.toLocaleString()}
                      </button>
                    )
                  ))}
                  {balance > 50000 && balance <= 10000000 && (
                    <button
                      type="button"
                      onClick={() => setAmount(balance.toString())}
                      className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
                    >
                      Max (UGX {balance.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Summary Section */}
            {phoneInput && amount && parseFloat(amount) > 0 && description && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From Wallet:</span>
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{displayPhoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-yellow-600">UGX {parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium">{description}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Remaining Balance:</span>
                    <span className="font-medium text-green-600">UGX {(balance - parseFloat(amount)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <CustomButton type="negative" fn={onClose} label="Cancel" />
              <CustomButton
                type="positive"
                label="Send Money"
                fn={handleSendMoney}
                isLoading={isLoading}
                disabled={isLoading || !phoneInput || !amount || !description}
              />
            </div>
          </div>
        </div>
      </div>

      <StatusModal />
    </>
  );
};

export default SendMoneyModal;