// WalletTable.tsx (updated with WithdrawModal)
import React, { useState } from 'react';
import { FaPlus, FaTrash, FaWallet, FaMoneyBillWave, FaToggleOn, FaToggleOff } from 'react-icons/fa6';
import { toast } from 'sonner';
import CustomDeleteModal from '../../../custom/modals/customDeleteModal';
import CustomTable from '../../../custom/table/customTable';
import useWallets from '../../../hooks/finance/useWallets';
import { apiRequest } from '../../../libs/apiConfig';
import { formatDate } from '../../../libs/dateFormatter';
import { WalletEndpoints } from '../../../endpoints/finance/FinanceEndpoints';
import { FaEdit } from 'react-icons/fa';
import AddOrModifyWallet from './AddorModify';
import WithdrawModal from './withdrawModal';
import SendMoneyModal from './SendMoneyModal';

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

const WalletTable: React.FC = () => {
  const { data: wallets, refresh } = useWallets();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedWallet, setSelectedWallet] = useState<IWallet | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [togglingWalletId, setTogglingWalletId] = useState<number | null>(null);
  const [sendMoneyModalOpen, setSendMoneyModalOpen] = useState<boolean>(false);

  const handleSendMoney = (wallet: IWallet) => {
  const balance = typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;
  const minSendAmount = 500;
  
  if (balance < minSendAmount) {
    toast.error(`Minimum send amount is UGX ${minSendAmount.toLocaleString()}. Current balance: UGX ${balance.toLocaleString()}`);
    return;
  }
  
  setSelectedWallet(wallet);
  setSendMoneyModalOpen(true);
    

};

  const deleteWallet = async () => {
    if (!selectedWallet) return;
    
    try {
      await apiRequest(WalletEndpoints.deleteWallet(selectedWallet.id), "DELETE", '');
      refresh();
      setDeleteModalOpen(false);
      setSelectedWallet(null);
      toast.success('Wallet deleted successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete wallet');
    }
  };

  const toggleWalletForSales = async (walletId: number, currentValue: boolean) => {
    setIsToggling(true);
    setTogglingWalletId(walletId);
    try {
      await apiRequest(
        WalletEndpoints.toggleWalletIsForSales(walletId.toString()), 
        'POST', 
        '',
        { isForSales: !currentValue }
      );
      refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update sales wallet flag');
    } finally {
      setIsToggling(false);
      setTogglingWalletId(null);
    }
  };

  const toggleWalletForTickets = async (walletId: number, currentValue: boolean) => {
    setIsToggling(true);
    setTogglingWalletId(walletId);
    try {
      await apiRequest(
        WalletEndpoints.toggleWalletIsForTickets(walletId.toString()), 
        'POST', 
        '',
        { isForTickets: !currentValue }
      );
      refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update tickets wallet flag');
    } finally {
      setIsToggling(false);
      setTogglingWalletId(null);
    }
  };

  const handleWithdraw = (wallet: IWallet) => {
    const balance = typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;
    const minWithdrawAmount = 5000;
    
    if (balance < minWithdrawAmount) {
      toast.error(`Minimum withdrawal amount is ${new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
      }).format(minWithdrawAmount)}. Current balance: ${new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
      }).format(balance)}`);
      return;
    }
    
    setSelectedWallet(wallet);
    setWithdrawModalOpen(true);
  };

  const columns = [
    {
      key: "name",
      label: "Wallet Name",
      render: (value: string, row: IWallet) => (
        <div className="flex items-center gap-2">
          <FaWallet className="text-gray-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { key: "purpose", label: "Purpose" },
    {
      key: "balance",
      label: "Balance (UGX)",
      render: (value: number | string) => {
        const balance = typeof value === 'string' ? parseFloat(value) : value;
        return (
          <span className={`font-semibold ${balance < 5000 ? 'text-red-600' : 'text-green-600'}`}>
            {new Intl.NumberFormat("en-UG", {
              style: "currency",
              currency: "UGX",
            }).format(balance || 0)}
          </span>
        );
      }
    },
    {
      key: "isForSales",
      label: "Sales Wallet",
      render: (value: boolean, row: IWallet) => (
        <button
          onClick={() => toggleWalletForSales(row.id, value)}
          disabled={isToggling && togglingWalletId === row.id}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {value ? (
            <FaToggleOn className="text-2xl text-green-600" />
          ) : (
            <FaToggleOff className="text-2xl text-gray-400" />
          )}
          <span className="text-sm">{value ? 'Yes' : 'No'}</span>
        </button>
      )
    },
    {
      key: "isForTickets",
      label: "Tickets Wallet",
      render: (value: boolean, row: IWallet) => (
        <button
          onClick={() => toggleWalletForTickets(row.id, value)}
          disabled={isToggling && togglingWalletId === row.id}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {value ? (
            <FaToggleOn className="text-2xl text-green-600" />
          ) : (
            <FaToggleOff className="text-2xl text-gray-400" />
          )}
          <span className="text-sm">{value ? 'Yes' : 'No'}</span>
        </button>
      )
    },
    {
      key: "createdAt",
      label: "Created Date",
      render: (value: string) => formatDate(value)
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: IWallet) => {
        const balance = typeof row.balance === 'string' ? parseFloat(row.balance) : row.balance;
        const canWithdraw = balance >= 5000;
        
        return (
          <div className="flex gap-3">
            {/* Withdraw Button - Always visible but disabled if balance < 5000 */}
            <div className="relative group">
              <button
                className={`transition-colors ${
                  canWithdraw 
                    ? 'text-yellow-600 hover:text-yellow-800' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => handleWithdraw(row)}
                disabled={!canWithdraw}
              >
                <FaMoneyBillWave />
              </button>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {canWithdraw ? 'Withdraw' : `Minimum withdrawal: UGX 5,000`}
              </span>
            </div>

            <div className="relative group">
              <button
                className={`transition-colors ${
                  canWithdraw 
                    ? 'text-green-600 hover:text-green-800' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => handleSendMoney(row)}
                disabled={!canWithdraw}
              >
                <FaMoneyBillWave className="transform rotate-90" />
              </button>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {canWithdraw ? 'Send Money' : `Minimum send: UGX 500`}
              </span>
            </div>

            {/* Edit Button - Only show if canBeDeleted is true */}
            {row.canBeDeleted && (
              <div className="relative group">
                <button
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  onClick={() => {
                    setSelectedWallet(row);
                    setShowModal(true);
                  }}
                >
                  <FaEdit />
                </button>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Edit Wallet
                </span>
              </div>
            )}

            {/* Delete Button - Only show if canBeDeleted is true */}
            {row.canBeDeleted && (
              <div className="relative group">
                <button
                  className="text-red-600 hover:text-red-800 transition-colors"
                  onClick={() => {
                    setSelectedWallet(row);
                    setDeleteModalOpen(true);
                  }}
                >
                  <FaTrash />
                </button>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Delete Wallet
                </span>
              </div>
            )}
          </div>
        );
      },
    }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Wallets</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          onClick={() => {
            setSelectedWallet(null);
            setShowModal(true);
          }}
        >
          <FaPlus /> New Wallet
        </button>
      </div>

      <CustomTable
        columns={columns}
        data={wallets}
      />

      {/* Add/Edit Wallet Modal */}
      <AddOrModifyWallet
        visible={showModal}
        wallet={selectedWallet}
        onCancel={() => {
          setShowModal(false);
          setSelectedWallet(null);
        }}
        onSuccess={() => {
          refresh();
          setShowModal(false);
          setSelectedWallet(null);
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        visible={withdrawModalOpen}
        wallet={selectedWallet}
        onClose={() => {
          setWithdrawModalOpen(false);
          setSelectedWallet(null);
        }}
        onSuccess={() => {
          refresh();
          setWithdrawModalOpen(false);
          setSelectedWallet(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <CustomDeleteModal 
        visible={deleteModalOpen} 
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedWallet(null);
        }} 
        onConfirm={deleteWallet}
        title="Delete Wallet"
        message={`Are you sure you want to delete ${selectedWallet?.name}? This action cannot be undone.`}
      />

      <SendMoneyModal
        visible={sendMoneyModalOpen}
        wallet={selectedWallet}
        onClose={() => {
          setSendMoneyModalOpen(false);
          setSelectedWallet(null);
        }}
        onSuccess={() => {
          refresh();
          setSendMoneyModalOpen(false);
          setSelectedWallet(null);
        }}
      />
    </div>
  );
};

export default WalletTable;