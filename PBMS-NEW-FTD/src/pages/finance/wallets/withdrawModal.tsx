// WithdrawModal.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  Banknote, 
  Building2, 

  Check
} from 'lucide-react';
import CustomButton from '../../../custom/buttons/customButton';
import CustomDropdown from '../../../custom/inputs/customDropdown';
import CustomTextInput from '../../../custom/inputs/customTextInput';
import { apiRequest } from '../../../libs/apiConfig';
import { TransactionEndpoints } from '../../../endpoints/finance/FinanceEndpoints';
import useChannels from '../../../hooks/finance/useChannels';
import type { IChannel } from '../../../redux/types/finance';

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

interface WithdrawModalProps {
  visible: boolean;
  wallet: IWallet | null;
  onClose: () => void;
  onSuccess: () => void;
}

type WithdrawType = 'MOBILE_MONEY' | 'BANK_TRANSFER' | '';

interface StatusStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  icon: React.ReactNode;
}

interface BankTransferStatus {
  status: string;
  data: {
    bank_transfer_request: {
      id: number;
      reference: string;
      amount: { formatted: string; raw: number; currency: string };
      charge_amount: { formatted: string; raw: number; currency: string };
      total_amount: { formatted: string; raw: number; currency: string };
      description: string;
      status: 'processing' | 'completed' | 'failed' | 'pending';
      bank_details: {
        bank_name: string;
        account_name: string;
        account_number: string;
        branch: string;
      };
      balance: { current: string; after_transaction: string };
      timeline: { created_at: string; approved_at: string | null; rejected_at: string | null };
      provider: { transaction_id: string; status_code: string; status_description: string };
    };
  };
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  visible,
  wallet,
  onClose,
  onSuccess,
}) => {
  const { data: allChannels } = useChannels();
  const [withdrawType, setWithdrawType] = useState<WithdrawType>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableChannels, setAvailableChannels] = useState<IChannel[]>([]);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Status steps configuration
  const statusSteps: StatusStep[] = [
    {
      id: 'submitted',
      title: 'Request Submitted',
      description: 'Your withdrawal request has been received',
      status: 'pending',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 'processing',
      title: 'Processing',
      description: 'Verifying transaction details',
      status: 'pending',
      icon: <Loader2 className="h-5 w-5" />,
    },
    {
      id: 'bank_processing',
      title: 'Bank Processing',
      description: 'Awaiting confirmation from bank',
      status: 'pending',
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      id: 'completed',
      title: 'Completed',
      description: 'Withdrawal successful!',
      status: 'pending',
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  // Filter channels based on selected withdraw type
  useEffect(() => {
    if (withdrawType && allChannels) {
      const filtered = allChannels.filter(
        (channel: IChannel) => 
          channel.type === withdrawType && 
          channel.isVerified === true
      );
      setAvailableChannels(filtered);
    } else {
      setAvailableChannels([]);
    }
    setSelectedChannel('');
  }, [withdrawType, allChannels]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setWithdrawType('');
      setSelectedChannel('');
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

  const validateAmount = (amountValue: string): boolean => {
    const numAmount = parseFloat(amountValue);
    const balance = getWalletBalance();
    const minWithdrawAmount = 3000;

    if (!amountValue || amountValue === '') {
      toast.error('Please enter an amount to withdraw');
      return false;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return false;
    }

    if (numAmount < minWithdrawAmount) {
      toast.error(`Minimum withdrawal amount is UGX ${minWithdrawAmount.toLocaleString()}`);
      return false;
    }

    if (numAmount > balance) {
      toast.error(`Amount exceeds available balance. Maximum withdrawal is UGX ${balance.toLocaleString()}`);
      return false;
    }

    return true;
  };

  const updateStepStatus = (stepId: string, status: 'pending' | 'processing' | 'completed' | 'failed') => {
    const stepIndex = statusSteps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const pollBankTransferStatus = async (reference: string): Promise<void> => {
    try {
      const response = await apiRequest<BankTransferStatus>(
        TransactionEndpoints.checkBankTransferStatus(reference),
        'GET',
        ''
      );

      if (response.status === 'success') {
        const transferStatus = response.data.bank_transfer_request.status;
        
        if (transferStatus === 'completed') {
          // Stop polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          
          // Update all steps to completed
          setCurrentStep(statusSteps.length);
          toast.success('Withdrawal completed successfully!');
          
          // Close modals after 2 seconds
          setTimeout(() => {
            setShowStatusModal(false);
            onSuccess();
            onClose();
          }, 2000);
        } else if (transferStatus === 'failed') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          toast.error('Withdrawal failed. Please contact support.');
          setTimeout(() => {
            setShowStatusModal(false);
          }, 2000);
        } else if (transferStatus === 'processing') {
          // Update progress based on provider status
          if (response.data.bank_transfer_request.provider?.status_code === '122') {
            updateStepStatus('bank_processing', 'processing');
          }
        }
      }
    } catch (error) {
      console.error('Error polling bank transfer status:', error);
    }
  };

  const startPolling = (reference: string) => {
    setTransactionReference(reference);
    setShowStatusModal(true);
    setCurrentStep(1);
    
    // Update steps as they progress
    setTimeout(() => updateStepStatus('submitted', 'completed'), 1000);
    setTimeout(() => updateStepStatus('processing', 'processing'), 2000);
    setTimeout(() => updateStepStatus('processing', 'completed'), 3000);
    setTimeout(() => updateStepStatus('bank_processing', 'processing'), 4000);
    
    // Start polling every 3 seconds
    const interval = setInterval(() => {
      pollBankTransferStatus(reference);
    }, 3000);
    
    setPollingInterval(interval);
  };

  const handleWithdraw = async () => {
    if (!wallet) {
      toast.error('Wallet not found');
      return;
    }

    if (!withdrawType) {
      toast.error('Please select withdrawal type');
      return;
    }

    if (!selectedChannel) {
      toast.error('Please select a withdrawal channel');
      return;
    }

    if (!amount) {
      toast.error('Please enter amount to withdraw');
      return;
    }

    if (!description || description.trim() === '') {
      toast.error('Please enter a description for this withdrawal');
      return;
    }

    if (!validateAmount(amount)) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        internalWalletId: wallet.id,
        channelId: parseInt(selectedChannel),
        amount: parseFloat(amount),
        type: withdrawType,
        description: description.trim(),
      };

      const response = await apiRequest(TransactionEndpoints.withdrawFromWallet, 'POST', '', payload);

      if (response.status === 200) {
        const reference = response.data?.reference || response.data?.data?.reference;
        if (reference) {
          startPolling(reference);
        } else {
          toast.success('Withdrawal request submitted successfully!');
          onSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  // Status Modal Component
// Status Modal Component
const StatusModal = () => {
  if (!showStatusModal) return null;

  const selectedChannelData = availableChannels.find(c => c.id.toString() === selectedChannel);
  const amountNum = parseFloat(amount);
  const channelName = selectedChannelData?.name || 'Bank Transfer';
  const allStepsCompleted = currentStep === statusSteps.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header with animated icon */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            {allStepsCompleted ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="relative">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                  <Banknote className="h-8 w-8 text-teal-600 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <div className="w-4 h-4 bg-teal-500 rounded-full animate-ping"></div>
                </div>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mt-3">
            {allStepsCompleted ? 'Withdrawal Complete!' : 'Processing Withdrawal'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {allStepsCompleted 
              ? 'Your funds have been transferred successfully'
              : 'Please wait while we process your request'}
          </p>
        </div>

        {/* Amount Display */}
        <div className="bg-gray-50 rounded-lg p-3 text-center mb-4">
          <p className="text-xs text-gray-500">Amount</p>
          <p className="text-2xl font-bold text-teal-600">
            UGX {amountNum.toLocaleString()}
          </p>
        </div>

        {/* Progress Steps */}
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

        {/* Transaction Details */}
        {transactionReference && (
          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Reference:</span>
              <span className="font-mono text-gray-700">{transactionReference.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Channel:</span>
              <span className="text-gray-700">{channelName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Description:</span>
              <span className="text-gray-700">{description}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / statusSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Close Button (only when complete) */}
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

  const withdrawTypeOptions = [
    { label: 'Mobile Money', value: 'MOBILE_MONEY' },
    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  ];

  const channelOptions = availableChannels.map((channel) => ({
    label: channel.type === 'MOBILE_MONEY' 
      ? `${channel.name} (${channel.phoneNumber})`
      : `${channel.name} - ${channel.bank} (${channel.accountNumber})`,
    value: channel.id.toString(),
  }));

  const balance = getWalletBalance();
  const minWithdrawAmount = 3000;
  const maxWithdrawAmount = balance;

  if (!visible || !wallet) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Withdraw from {wallet.name}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Available Balance: UGX {balance.toLocaleString()}
          </p>

          <div className="space-y-4">
            {/* Withdrawal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Type *
              </label>
              <CustomDropdown
                options={withdrawTypeOptions}
                value={withdrawType ? [withdrawType] : []}
                onChange={(values: string[]) => setWithdrawType(values[0] as WithdrawType)}
                placeholder="Select withdrawal type"
                singleSelect={true}
              />
            </div>

            {/* Channel Selection */}
            {withdrawType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {withdrawType === 'MOBILE_MONEY' ? 'Mobile Money Channel *' : 'Bank Account *'}
                </label>
                <CustomDropdown
                  options={channelOptions}
                  value={selectedChannel ? [selectedChannel] : []}
                  onChange={(values: string[]) => setSelectedChannel(values[0] || '')}
                  placeholder={
                    availableChannels.length === 0 
                      ? `No verified ${withdrawType === 'MOBILE_MONEY' ? 'mobile money' : 'bank'} channels available` 
                      : `Select ${withdrawType === 'MOBILE_MONEY' ? 'mobile money channel' : 'bank account'}`
                  }
                  singleSelect={true}
                  disabled={availableChannels.length === 0}
                />
                {availableChannels.length === 0 && withdrawType && (
                  <p className="text-xs text-red-500 mt-1">
                    No verified {withdrawType === 'MOBILE_MONEY' ? 'mobile money channels' : 'bank accounts'} found. 
                    Please add and verify a channel first.
                  </p>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (UGX) *
              </label>
              <CustomTextInput
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Enter amount (Min: UGX ${minWithdrawAmount.toLocaleString()}, Max: UGX ${maxWithdrawAmount.toLocaleString()})`}
                min={minWithdrawAmount}
                max={maxWithdrawAmount}
                step="1000"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Minimum: UGX {minWithdrawAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Maximum: UGX {maxWithdrawAmount.toLocaleString()}</p>
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
                placeholder="Enter reason for withdrawal (e.g., Staff salaries, Operational costs, etc.)"
              />
            </div>

            {/* Quick Amount Buttons */}
            {balance > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select Amount
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[5000, 10000, 20000, 50000, 100000, 200000].map((amt) => (
                    amt <= balance && (
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
                  {balance > 200000 && (
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
            {withdrawType && selectedChannel && amount && parseFloat(amount) > 0 && description && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Withdrawal Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wallet:</span>
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-yellow-600">UGX {parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Channel:</span>
                    <span className="font-medium">{availableChannels.find(c => c.id.toString() === selectedChannel)?.name}</span>
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
                label="Withdraw"
                fn={handleWithdraw}
                isLoading={isLoading}
                disabled={isLoading || !withdrawType || !selectedChannel || !amount || !description}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal />
    </>
  );
};

export default WithdrawModal;