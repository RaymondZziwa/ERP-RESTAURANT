// PaymentWaitingModal.tsx (fixed - closes after 5 seconds on success)
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaMobileAlt, 
  FaClock,
  FaHourglassHalf,
  FaExclamationTriangle
} from 'react-icons/fa';
import { SALESENDPOINTS } from '../../../endpoints/sales/salesEndpoints';
import { apiRequest } from '../../../libs/apiConfig';

interface PaymentWaitingModalProps {
  visible: boolean;
  reference: string | null;
  onClose: () => void;
  onPaymentComplete: () => void;
  onPaymentFailed: () => void;
}

const PaymentWaitingModal: React.FC<PaymentWaitingModalProps> = ({
  visible,
  reference,
  onClose,
  onPaymentComplete,
  onPaymentFailed,
}) => {
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'timeout'>('pending');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const isPollingActive = useRef(true);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Stop all polling and timeouts
  const stopPolling = () => {
    isPollingActive.current = false;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  // Poll payment status
  const pollPaymentStatus = async (paymentRef: string) => {
    if (!isPollingActive.current) return;
    
    try {
      const endpoint = SALESENDPOINTS.POS.PING_PAYMENT_STATUS(paymentRef);
      const response = await apiRequest(endpoint, 'GET', '');
      
      console.log('Payment status response:', response);
      
      // Update poll count for debugging
      setPollCount(prev => prev + 1);
      
      // Handle different statuses from your API
      if (response?.data?.status === 'COMPLETED') {
        // Payment successful - STOP POLLING IMMEDIATELY
        console.log('Payment completed! Stopping polling...');
        stopPolling();
        setStatus('completed');
        
        // Close modal after 5 seconds and then complete sale
        successTimeoutRef.current = setTimeout(() => {
          onPaymentComplete();
        }, 5000); // 5 seconds delay
        
        return;
      }
      
      if (response?.data?.status === 'FAILED') {
        // Payment failed - STOP POLLING IMMEDIATELY
        console.log('Payment failed! Stopping polling...');
        stopPolling();
        setStatus('failed');
        
        // Show failure for 3 seconds then close
        setTimeout(() => {
          if (isPollingActive.current !== false) {
            onPaymentFailed();
          }
        }, 3000);
        return;
      }
      
      if (response?.data?.status === 'PENDING') {
        // Still pending - continue polling
        console.log(`Payment still pending (poll #${pollCount + 1})`);
      }
      
    } catch (error) {
      console.error('Error polling payment status:', error);
      // Don't stop polling on error, continue checking
    }
  };

  // Start polling and timeout
  const startPolling = (paymentRef: string) => {
    isPollingActive.current = true;
    
    // Poll every 3 seconds
    const interval = setInterval(() => {
      if (paymentRef && isPollingActive.current) {
        pollPaymentStatus(paymentRef);
      }
    }, 3000);
    
    pollingIntervalRef.current = interval;
    
    // Timeout after 5 minutes (300 seconds)
    const timeout = setTimeout(() => {
      if (status === 'pending' && isPollingActive.current) {
        console.log('Payment timeout! Stopping polling...');
        stopPolling();
        setStatus('timeout');
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    }, 300000);
    
    timeoutIdRef.current = timeout;
  };

  // Timer for elapsed time
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (status === 'pending') {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  // Start polling when modal becomes visible
  useEffect(() => {
    if (visible && reference) {
      console.log('Starting polling for reference:', reference);
      setStatus('pending');
      setElapsedTime(0);
      setPollCount(0);
      startPolling(reference);
    }
    
    // Cleanup when modal closes or unmounts
    return () => {
      stopPolling();
    };
  }, [visible, reference]);

  // Get status message based on elapsed time
  const getStatusMessage = () => {
    if (elapsedTime < 15) {
      return "Please check your phone and enter your PIN to complete the payment.";
    } else if (elapsedTime < 30) {
      return "Still waiting for PIN confirmation. Please check your phone.";
    } else if (elapsedTime < 60) {
      return "Taking longer than expected. Make sure you've entered your PIN.";
    } else {
      return "Still processing. This may take a few more moments...";
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        
        {/* Pending State */}
        {status === 'pending' && (
          <div className="p-8 text-center">
            {/* Animation */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto">
                <div className="absolute w-24 h-24 rounded-full border-4 border-gray-200"></div>
                <div className="absolute w-24 h-24 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaMobileAlt className="text-3xl text-teal-500 animate-pulse" />
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Processing Payment
            </h3>
            
            <p className="text-gray-600 mb-4">
              {getStatusMessage()}
            </p>
            
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono text-blue-600 font-medium">
                  {reference?.slice(0, 8)}...{reference?.slice(-8)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Waiting time:</span>
                <span className="font-mono text-teal-600 font-medium">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Attempts:</span>
                <span className="font-mono text-gray-600 font-medium">
                  {pollCount} checking...
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.min((elapsedTime / 300) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Timeout in {formatTime(Math.max(0, 300 - elapsedTime))}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <FaHourglassHalf className="animate-pulse" />
              <span>Waiting for payment confirmation...</span>
            </div>
            
            <button
              onClick={() => {
                stopPolling();
                onClose();
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        )}
        
        {/* Completed State - Shows for 5 seconds then auto-closes */}
        {status === 'completed' && (
          <div className="p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <FaCheckCircle className="text-5xl text-green-500" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Payment Successful!
            </h3>
            
            <p className="text-gray-600 mb-4">
              Your payment has been confirmed. Redirecting in 5 seconds...
            </p>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">Transaction ID:</span>
                <span className="font-mono text-green-700 font-medium">
                  {reference?.slice(0, 12)}...
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-600 h-1.5 rounded-full animate-progress"></div>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 text-center">
                Closing in 5 seconds...
              </p>
            </div>
          </div>
        )}
        
        {/* Failed State */}
        {status === 'failed' && (
          <div className="p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <FaTimesCircle className="text-5xl text-red-500" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Payment Failed
            </h3>
            
            <p className="text-gray-600 mb-4">
              The payment could not be processed. Please try again.
            </p>
            
            <div className="bg-red-50 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <p>
                  Possible reasons: Insufficient funds, wrong PIN, 
                  network timeout, or transaction cancelled by user.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                stopPolling();
                onClose();
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
        
        {/* Timeout State */}
        {status === 'timeout' && (
          <div className="p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <FaClock className="text-5xl text-orange-500" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-orange-600 mb-2">
              Payment Timeout
            </h3>
            
            <p className="text-gray-600 mb-4">
              The payment took too long to complete. The transaction has expired.
            </p>
            
            <div className="bg-orange-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-orange-700">
                Please try again or use a different payment method.
              </p>
            </div>
            
            <button
              onClick={() => {
                stopPolling();
                onClose();
              }}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentWaitingModal;