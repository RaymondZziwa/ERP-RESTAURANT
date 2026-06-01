// VerifyMeterModal.tsx
import React, { useState } from 'react';
import { FaCheck, FaSpinner, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaBolt, FaTint } from 'react-icons/fa';
import { apiRequest } from '../../../libs/apiConfig';
import { toast } from 'sonner';
import { BILLING_CHANNELS } from '../../../endpoints/expense/expenseEndpoints';
import axios from 'axios';

interface IBillingChannel {
  id: number;
  utility: 'NWSC' | 'LIGHT';
  name: string | null;
  meterNumber: string;
  isVerified: boolean;
  area: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VerifyMeterModalProps {
  visible: boolean;
  channel: IBillingChannel | null;
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

const VerifyMeterModal: React.FC<VerifyMeterModalProps> = ({
  visible,
  channel,
  onClose,
  onSuccess,
}) => {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [area, setArea] = useState(channel?.area || '');
  const [showConnectingModal, setShowConnectingModal] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0);
  const token = ''
  const connectionSteps = [
    { message: `Connecting to ${channel?.utility === 'NWSC' ? 'NWSC' : 'UEDCL'} servers...`, icon: channel?.utility === 'NWSC' ? FaTint : FaBolt },
    { message: 'Authenticating credentials...', icon: FaSpinner },
    { message: 'Fetching meter details...', icon: FaSpinner },
    { message: 'Verifying customer information...', icon: FaSpinner },
  ];

  const handleVerify = async () => {
    if (!channel) return;

    // Show connecting modal and start animation
    setShowConnectingModal(true);
    setConnectionStep(0);

    // Animate through connection steps
    for (let i = 0; i < connectionSteps.length; i++) {
      setConnectionStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const payload: any = {
        meterNumber: channel.meterNumber,
        utilityType: channel.utility,
        channelId: channel.id,
      };

      if (channel.utility === 'NWSC' && area) {
        payload.area = area;
      }

      const response = await axios.post(
        BILLING_CHANNELS.VERIFY,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Close connecting modal
      setShowConnectingModal(false);

      if (response.status === 200 && response.data.status === 'success') {
        setVerificationData(response.data.data);
        toast.success(response.data.message || 'Meter number verified successfully');
        onSuccess();
      } else {
        toast.error(response.data?.message || 'Verification failed');
      }
    } catch (error: any) {
      setShowConnectingModal(false);
      toast.error(error?.response?.data?.message || 'Failed to verify meter number');
    }
  };

  if (!visible || !channel) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Verify Meter Number
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {channel.utility === 'NWSC' ? 'Water Meter' : 'Electricity Meter'} Verification
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Channel Info */}
            <div className="bg-teal-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Utility:</span>
                <span className="text-sm font-semibold text-teal-700">
                  {channel.utility === 'NWSC' ? 'NWSC (Water)' : 'UEDCL (Electricity)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Meter Number:</span>
                <span className="text-sm font-mono font-semibold text-gray-800">
                  {channel.meterNumber}
                </span>
              </div>
              {channel.name && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Customer Name:</span>
                  <span className="text-sm font-medium text-gray-800">{channel.name}</span>
                </div>
              )}
            </div>

            {/* Area Input for NWSC */}
            {channel.utility === 'NWSC' && !verificationData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (Optional)
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Enter area (e.g., Kampala)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Providing area helps verify the correct water meter
                </p>
              </div>
            )}

            {/* Verification Results */}
            {verificationData && (
              <div className="space-y-4 mt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaCheck className="text-green-600" />
                    <span className="font-semibold text-green-800">Verification Successful</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <FaUser className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Customer Name</p>
                        <p className="text-sm font-medium text-gray-800">
                          {verificationData.customer_details.customer_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Area</p>
                        <p className="text-sm font-medium text-gray-800">
                          {verificationData.customer_details.area}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <FaMoneyBillWave className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Outstanding Balance</p>
                        <p className="text-sm font-semibold text-red-600">
                          UGX {parseFloat(verificationData.customer_details.outstanding_balance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <FaCalendarAlt className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Last Payment</p>
                        <p className="text-sm font-medium text-gray-800">
                          {verificationData.customer_details.last_payment_date} - 
                          UGX {parseFloat(verificationData.customer_details.last_payment_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            
            {!verificationData && (
              <button
                type="button"
                onClick={handleVerify}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-all"
              >
                <FaCheck />
                Verify Meter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connecting Animation Modal */}
      {showConnectingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            {/* Animated Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500 rounded-full opacity-20 animate-ping"></div>
                <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  {React.createElement(connectionSteps[connectionStep]?.icon || FaSpinner, {
                    className: "text-white text-3xl animate-pulse"
                  })}
                </div>
              </div>
            </div>

            {/* Progress Message */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {connectionSteps[connectionStep]?.message || 'Processing...'}
              </h3>
              <p className="text-gray-500 text-sm">
                Please wait while we connect to the server
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((connectionStep + 1) / connectionSteps.length) * 100}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {connectionSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx <= connectionStep ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-xs text-gray-400 mt-1 hidden sm:block">
                    Step {idx + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Loading Dots Animation */}
            <div className="flex justify-center gap-1 mt-6">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VerifyMeterModal;