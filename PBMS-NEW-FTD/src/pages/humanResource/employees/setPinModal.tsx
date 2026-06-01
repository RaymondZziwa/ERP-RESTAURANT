import { useState, useEffect } from 'react';
import { FaKey, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import type { IEmployee } from '../../../redux/types/hr';

interface SetPinModalProps {
  visible: boolean;
  employee: IEmployee | null;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
}

const SetPinModal: React.FC<SetPinModalProps> = ({ visible, employee, onCancel, onConfirm }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setPin('');
      setConfirmPin('');
      setError('');
    }
  }, [visible]);

  const handleConfirm = () => {
    // Validate PIN
    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    
    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }
    
    setError('');
    onConfirm(pin);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-full">
              <FaKey className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Set Employee PIN</h2>
              <p className="text-sm text-gray-500">
                {employee ? `${employee.firstName} ${employee.lastName}` : 'Select an employee'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4-Digit PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPin ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Must be 4 digits, numbers only</p>
          </div>

          {/* Confirm PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm PIN
            </label>
            <div className="relative">
              <input
                type={showConfirmPin ? "text" : "password"}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Re-enter PIN"
                maxLength={4}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPin ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* PIN Requirements */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-medium mb-1">PIN Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li className={pin.length >= 4 ? "text-green-600" : ""}>At least 4 digits</li>
              <li className={/^\d+$/.test(pin) && pin.length > 0 ? "text-green-600" : ""}>Numbers only (no letters or special characters)</li>
              <li className={pin === confirmPin && pin.length >= 4 ? "text-green-600" : ""}>PIN and confirmation must match</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <FaKey className="text-sm" />
            Set PIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetPinModal;