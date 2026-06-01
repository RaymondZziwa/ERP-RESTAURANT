// BankTransferVerification.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import CustomButton from '../../../custom/buttons/customButton';
import CustomDropdown from '../../../custom/inputs/customDropdown';
import CustomTextInput from '../../../custom/inputs/customTextInput';
import { apiRequest } from '../../../libs/apiConfig';
import { ChannelEndpoints } from '../../../endpoints/finance/FinanceEndpoints';
import type { IChannel } from '../../../redux/types/finance';
import useSupportedBanks from '../../../hooks/finance/useSupportedBanks';

interface ISupportedBanks {
  code: string;
  name: string;
  aliases: string[];
}

interface BankTransferVerificationProps {
  visible: boolean;
  channel: IChannel | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BankTransferVerification: React.FC<BankTransferVerificationProps> = ({
  visible,
  channel,
  onClose,
  onSuccess,
}) => {
  const {data: supportedBanks} = useSupportedBanks();
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
  });

  // Fetch supported banks when modal opens
  useEffect(() => {
    if (visible && channel && channel.type === 'BANK_TRANSFER') {
      // Pre-fill with existing channel data
      setFormData({
        bank_name: channel.bank || '',
        account_number: channel.accountNumber || '',
      });
    }
  }, [visible, channel]);

  const handleVerify = async () => {
    const { bank_name, account_number } = formData;
    
    if (!bank_name) {
      toast.error('Please select a bank');
      return;
    }
    
    if (!account_number) {
      toast.error('Please enter account number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(
        ChannelEndpoints.verifyBankTransfer(channel?.id),
        'GET',
        '',
        { bank_name, account_number }
      );

      if (response.status === 400) {
        toast.error(response.data.message || 'Verification failed');
        return;
      }
      //toast.success('Bank account verified successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Bank options from API
  const bankOptions = supportedBanks.map((bank) => ({
    label: `${bank.name} (${bank.code})`,
    value: bank.name,
  }));

  if (!visible || !channel || channel.type !== 'BANK_TRANSFER') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Verify Bank Account
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Verify bank account details for {channel.name}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name *
            </label>
            <CustomDropdown
              options={bankOptions}
              value={formData.bank_name ? [formData.bank_name] : []}
              onChange={(values: string[]) =>
                setFormData((p) => ({ ...p, bank_name: values[0] || '' }))
              }
              placeholder={isLoadingBanks ? "Loading banks..." : "Select bank"}
              singleSelect={true}
              disabled={isLoadingBanks}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <CustomTextInput
              type="text"
              value={formData.account_number}
              onChange={(val) => setFormData((p) => ({ ...p, account_number: val }))}
              placeholder="Enter account number"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong>
              We are going to connect the respective bank servers for information verification.
              This process may take a few seconds.
              Please ensure the details you entered are correct to avoid verification failure.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <CustomButton type="negative" fn={onClose} label="Cancel" />
            <CustomButton
              type="positive"
              label="Verify Account"
              fn={handleVerify}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransferVerification;