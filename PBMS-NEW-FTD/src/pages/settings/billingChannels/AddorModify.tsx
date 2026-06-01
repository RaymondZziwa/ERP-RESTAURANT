import React, { useState, useEffect } from 'react';
import CustomTextInput from '../../../custom/inputs/customTextInput';
import CustomDropdown from '../../../custom/inputs/customDropdown';
import { apiRequest } from '../../../libs/apiConfig';
import CustomButton from '../../../custom/buttons/customButton';
import { toast } from 'sonner';
import { BILLING_CHANNELS } from '../../../endpoints/expense/expenseEndpoints';
import uedclLogo from '../../../assets/uedcl.png';
import nwscLogo from '../../../assets/mwsc.png';

interface BillingChannel {
  id?: number;
  utility: 'LIGHT' | 'NWSC';
  meterNumber: string;
  name?: string;
  area?: string;
}

interface AddOrModifyBillingChannelProps {
  visible: boolean;
  channel: BillingChannel | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface AreaResponse {
  status: string;
  data: {
    utility_code: string;
    utility_name: string;
    areas: string[];
    count: number;
    description: string;
  };
}

const AddOrModifyBillingChannel: React.FC<AddOrModifyBillingChannelProps> = ({
  visible,
  channel,
  onCancel,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    utility: 'NWSC' as 'LIGHT' | 'NWSC',
    meterNumber: '',
    name: '',
    area: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);

  // Fetch areas when NWSC is selected
  useEffect(() => {
    const fetchAreas = async () => {
      if (formData.utility === 'NWSC') {
        setIsLoadingAreas(true);
        try {
          const response = await apiRequest<AreaResponse>(BILLING_CHANNELS.NWSC_AREAS, 'GET', '');
          if (response.status === 'success' && response.data?.areas) {
            setAreas(response.data.areas);
          } else {
            setAreas([]);
          }
        } catch (error) {
          console.error('Failed to fetch areas:', error);
          setAreas([]);
        } finally {
          setIsLoadingAreas(false);
        }
      } else {
        setAreas([]);
      }
    };

    if (visible && formData.utility === 'NWSC') {
      fetchAreas();
    }
  }, [visible, formData.utility]);

  // Update form data when channel prop changes
  useEffect(() => {
    if (channel) {
      setFormData({
        utility: channel.utility || 'NWSC',
        meterNumber: channel.meterNumber || '',
        name: channel.name || '',
        area: channel.area || ''
      });
    } else {
      setFormData({
        utility: 'NWSC',
        meterNumber: '',
        name: '',
        area: ''
      });
    }
  }, [channel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.meterNumber) {
      toast.error("Please enter meter number");
      return;
    }

    if (!formData.utility) {
      toast.error("Please select utility type");
      return;
    }

    // Validate area for NWSC
    if (formData.utility === 'NWSC' && !formData.area) {
      toast.error("Please select an area for water bill verification");
      return;
    }

    // Prepare payload based on utility type
    const payload: any = {
      utility: formData.utility,
      meterNumber: formData.meterNumber,
    };

    // Add name if provided
    if (formData.name) {
      payload.name = formData.name;
    }

    // Add area only for NWSC (water)
    if (formData.utility === 'NWSC' && formData.area) {
      payload.area = formData.area;
    }

    setIsSubmitting(true);

    try {
      const endpoint = channel 
        ? BILLING_CHANNELS.MODIFY(channel.id!) 
        : BILLING_CHANNELS.CREATE;
      const method = channel ? "PUT" : "POST";
      
      await apiRequest(endpoint, method, '', payload);
      
      // Reset form
      setFormData({
        utility: 'NWSC',
        meterNumber: '',
        name: '',
        area: ''
      });
      
      onSuccess();
      onCancel();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save billing channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert areas to dropdown options
  const areaOptions = areas.map(area => ({
    value: area,
    label: area
  }));

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {channel ? 'Edit Billing Channel' : 'Add New Billing Channel'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Utility Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utility Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, utility: 'NWSC', area: '' }))}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    formData.utility === 'NWSC'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={nwscLogo} alt="NWSC Logo" className="h-10 w-10" />
                  <span className={`text-sm font-medium ${formData.utility === 'NWSC' ? 'text-teal-600' : 'text-gray-600'}`}>
                    NWSC (Water)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, utility: 'LIGHT' }))}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    formData.utility === 'LIGHT'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={uedclLogo} alt="UEDCL Logo" className="h-10 w-10" />
                  <span className={`text-sm font-medium ${formData.utility === 'LIGHT' ? 'text-teal-600' : 'text-gray-600'}`}>
                    UEDCL (Electricity)
                  </span>
                </button>
              </div>
            </div>

            {/* Customer Name (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name (Optional)
              </label>
              <CustomTextInput
                type="text"
                name="name"
                value={formData.name}
                onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                placeholder="Enter customer name"
              />
            </div>

            {/* Meter Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meter Number *
              </label>
              <CustomTextInput
                type="text"
                name="meterNumber"
                value={formData.meterNumber}
                onChange={(val) => setFormData(prev => ({ ...prev, meterNumber: val }))}
                placeholder="Enter meter number"
                required
              />
            </div>

            {/* Area - Dropdown for NWSC */}
            {formData.utility === 'NWSC' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area *
                </label>
                {isLoadingAreas ? (
                  <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading areas...</span>
                  </div>
                ) : (
                  <CustomDropdown
                    options={areaOptions}
                    value={formData.area ? [formData.area] : []}
                    onChange={(values: string[]) => setFormData(prev => ({ ...prev, area: values[0] || '' }))}
                    placeholder="Select area"
                    singleSelect={true}
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">Select the area where the meter is located for proper verification</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <CustomButton type='negative' fn={onCancel} />
            <CustomButton 
              autoCloseModal={onCancel} 
              label={channel ? 'Update Channel' : 'Create Channel'} 
              fn={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrModifyBillingChannel;