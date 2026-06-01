import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBolt } from 'react-icons/fa';
import { toast } from 'sonner';
import CustomDeleteModal from '../../custom/modals/customDeleteModal';
import CustomTable from '../../custom/table/customTable';
import { apiRequest } from '../../libs/apiConfig';
import AddOrModifyBranchExpense from './AddorModify';
import UtilityPaymentModal from './utilityPaymentModal';
import { BranchExpenseEndpoints } from '../../endpoints/expense/expenseEndpoints';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import type { IBranchExpense } from '../../redux/types/expenses';

const BranchExpensesManagement = () => {
  const branch = useSelector((state: RootState) => state.userAuth.data.branch);
  const [expenses, setExpenses] = useState<IBranchExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);

  const [modalProps, setModalProps] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | '';
    expense: IBranchExpense | null;
  }>({
    isOpen: false,
    mode: 'create',
    expense: null,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ✅ Fetch all expenses
  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(BranchExpenseEndpoints.fetchExpenses(branch.id), 'GET', '');
      setExpenses(response.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ✅ Delete an expense
  const deleteExpense = async () => {
    try {
      if (modalProps.expense) {
        await apiRequest(BranchExpenseEndpoints.deleteExpense(modalProps.expense.id), 'DELETE', '');
        setIsDeleteModalOpen(false);
        fetchExpenses();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete expense');
    }
  };

  // ✅ Table columns configuration
  const columns = [
    { key: 'branch', label: 'Branch', sortable: true, filterable: true },
    { key: 'category', label: 'Category', sortable: true, filterable: true },
    { key: 'title', label: 'Title', sortable: true, filterable: true },
    { key: 'amount', label: 'Amount (UGX)', sortable: true, filterable: true },
    { key: 'dateIncurred', label: 'Date Incurred', sortable: true, filterable: true },
    { 
      key: 'recordedBy', 
      label: 'Recorded By', 
      sortable: true, 
      filterable: false,
      render: (value: any, row: any) => row.employeeName || value
    },
    { key: 'actions', label: 'Actions', sortable: false, filterable: false },
  ];

  // ✅ Format date
  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // ✅ Prepare data for table
  const tableData = expenses.map(exp => ({
    ...exp,
    branch: exp.branch?.name || '-',
    category: exp.category || '-',
    amount: exp.amount.toLocaleString(),
    dateIncurred: formatDate(exp.dateIncurred),
    employeeName: exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : exp.recordedBy,
    recordedBy: exp.recordedBy,
    actions: (
      <div className="flex gap-3">
        <div className="relative group">
          <button
            className="text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setModalProps({ isOpen: true, mode: 'edit', expense: exp })}
          >
            <FaEdit />
          </button>
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 
            bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 
            transition-opacity pointer-events-none whitespace-nowrap z-10">
            Edit
          </span>
        </div>

        <div className="relative group">
          <button
            className="text-red-600 hover:text-red-800 transition-colors"
            onClick={() => {
              setModalProps({ isOpen: false, mode: '', expense: exp });
              setIsDeleteModalOpen(true);
            }}
          >
            <FaTrash />
          </button>
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 
            bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 
            transition-opacity pointer-events-none whitespace-nowrap z-10">
            Delete
          </span>
        </div>
      </div>
    ),
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Branch Expenses</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setIsUtilityModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FaBolt className="mr-2" />
            Pay Utility Bill
          </button>
          <button
            onClick={() => setModalProps({ isOpen: true, mode: 'create', expense: null })}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add New Expense
          </button>
        </div>
      </div>

      <CustomTable
        columns={columns}
        data={tableData}
        pageSize={10}
        isLoading={isLoading}
      />

      <AddOrModifyBranchExpense
        visible={modalProps.isOpen}
        expense={modalProps.expense}
        onCancel={() => setModalProps({ isOpen: false, mode: 'create', expense: null })}
        onSuccess={fetchExpenses}
      />

      <CustomDeleteModal
        visible={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteExpense}
      />

      <UtilityPaymentModal
        visible={isUtilityModalOpen}
        onClose={() => setIsUtilityModalOpen(false)}
        onSuccess={() => {
          setIsUtilityModalOpen(false);
          fetchExpenses();
        }}
      />
    </div>
  );
};

export default BranchExpensesManagement;