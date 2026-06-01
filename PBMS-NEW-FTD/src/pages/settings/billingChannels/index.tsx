import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBolt, FaTint, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import CustomTable from '../../../custom/table/customTable';
import CustomDeleteModal from '../../../custom/modals/customDeleteModal';
import { toast } from 'sonner';
import { apiRequest } from '../../../libs/apiConfig';
import type { IBillingChannel } from '../../../redux/types/systemSettings';
import useBillingChannels from '../../../hooks/settings/useBillingChannels';
import { BILLING_CHANNELS } from '../../../endpoints/expense/expenseEndpoints';
import AddOrModifyBillingChannel from './AddorModify';
import VerifyMeterModal from './verifyChannelModal';

const BillingChannelsManagement = () => {
 const {data: billingChannels, refresh} = useBillingChannels();
  const [isLoading, setIsLoading] = useState(false);
  
  const [modalProps, setModalProps] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | '';
    channel: IBillingChannel | null;
  }>({
    isOpen: false,
    mode: 'create',
    channel: null
  });
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<IBillingChannel | null>(null);


  // Delete billing channel
  const deleteBillingChannel = async () => {
    try {
      if (modalProps.channel) {
        await apiRequest(BILLING_CHANNELS.DELETE(modalProps.channel.id), "DELETE", '');
       // toast.success('Billing channel deleted successfully');
        setIsDeleteModalOpen(false);
        refresh(); // Refresh the billing channels list
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete billing channel');
    }
  };

  // Table columns configuration
  const columns = [
    { key: 'utility', label: 'Utility', sortable: true, filterable: true },
    { key: 'name', label: 'Customer Name', sortable: true, filterable: true },
    { key: 'meterNumber', label: 'Meter Number', sortable: true, filterable: true },
    { key: 'area', label: 'Area', sortable: true, filterable: true },
    { 
      key: 'isVerified', 
      label: 'Status', 
      sortable: true, 
      filterable: true,
      render: (value: boolean) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
          {value ? 'Verified' : 'Pending'}
        </span>
      )
    },
    { key: 'createdAt', label: 'Created At', sortable: true, filterable: false },
    { key: 'actions', label: 'Actions', sortable: false, filterable: false },
  ];

  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get utility icon
  const getUtilityIcon = (utility: string) => {
    if (utility === 'NWSC') {
      return <FaTint className="text-blue-500" />;
    }
    return <FaBolt className="text-yellow-500" />;
  };

  // Prepare data for the table
  const tableData = billingChannels.map(channel => ({
    ...channel,
    utility: (
      <div className="flex items-center gap-2">
        {getUtilityIcon(channel.utility)}
        <span>{channel.utility === 'NWSC' ? 'NWSC (Water)' : 'UEDCL (Electricity)'}</span>
      </div>
    ),
    name: channel.name || '-',
    meterNumber: channel.meterNumber,
    area: channel.area || '-',
    isVerified: channel.isVerified,
    createdAt: formatDate(channel.createdAt),
    actions: (
      <div className="flex gap-3">
        {/* Verify Button - Only show if not verified */}
        {!channel.isVerified && (
          <div className="relative group">
            <button
              className="text-green-600 hover:text-green-800 transition-colors"
              onClick={() => {
                setSelectedChannel(channel);
                setIsVerifyModalOpen(true);
              }}
            >
              <FaCheckCircle />
            </button>
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Verify Meter
            </span>
          </div>
        )}

        {/* Edit Button */}
        {
          !channel.isVerified && ( <div className="relative group">
          <button
            className="text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setModalProps({ isOpen: true, mode: 'edit', channel: channel })}
          >
            <FaEdit />
          </button>
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Edit
          </span>
        </div>)
       }
        
        {/* Delete Button */}
        <div className="relative group">
          <button
            className="text-red-600 hover:text-red-800 transition-colors"
            onClick={() => {
              setModalProps({ isOpen: false, mode: '', channel: channel });
              setIsDeleteModalOpen(true);
            }}
          >
            <FaTrash />
          </button>
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Delete
          </span>
        </div>
      </div>
    )
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Billing Channels</h2>
        <button
          onClick={() => setModalProps({ isOpen: true, mode: 'create', channel: null })}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          Add Billing Channel
        </button>
      </div>

      <CustomTable 
        columns={columns} 
        data={tableData} 
        pageSize={10} 
        isLoading={isLoading}
      />

      <AddOrModifyBillingChannel
        visible={modalProps.isOpen}
        channel={modalProps.channel}
        onCancel={() => setModalProps({ isOpen: false, mode: "create", channel: null })}
        onSuccess={() => {
          refresh()
          setModalProps({ isOpen: false, mode: "create", channel: null });
        }}
      />
      
      <CustomDeleteModal
        visible={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteBillingChannel}
      />

      <VerifyMeterModal
        visible={isVerifyModalOpen}
        channel={selectedChannel}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedChannel(null);
        }}
        onSuccess={() => {
          refresh();
          setIsVerifyModalOpen(false);
          setSelectedChannel(null);
        }}
      />
    </div>
  );
};

export default BillingChannelsManagement;