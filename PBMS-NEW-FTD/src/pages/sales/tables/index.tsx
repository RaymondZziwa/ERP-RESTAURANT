import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import CustomTable from '../../../custom/table/customTable';
import CustomDeleteModal from '../../../custom/modals/customDeleteModal';
import { toast } from 'sonner';
import { apiRequest } from '../../../libs/apiConfig';
import type { ITable } from '../../../redux/types/table';
import useTables from '../../../hooks/sales/useTables';
import { SALESENDPOINTS } from '../../../endpoints/sales/salesEndpoints';
import AddOrModifyTable from './AddorModify';

const TableManagement = () => {
  const { data, refresh } = useTables();
  const [tables, setTables] = useState<ITable[]>(data);

  useEffect(() => {
    setTables(data);
  }, [data]);

  const [modalProps, setModalProps] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | '';
    table: ITable | null;
  }>({
    isOpen: false,
    mode: 'create',
    table: null
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteTable = async () => {
    try {
      if (modalProps.table) {
        await apiRequest(
          SALESENDPOINTS.TABLE.delete(modalProps.table.id),
          'DELETE',
          ''
        );
        refresh();
        setIsDeleteModalOpen(false);
        toast.success('Table deleted successfully');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete table');
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Available' },
      OCCUPIED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Occupied' },
      RESERVED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Reserved' },
      OUT_OF_SERVICE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Out of Service' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.AVAILABLE;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Table columns configuration
  const columns = [
    { key: 'number', label: 'Table Number', sortable: true, filterable: true },
    { key: 'status', label: 'Status', sortable: true, filterable: true },
    { key: 'createdAt', label: 'Created At', sortable: true, filterable: false },
    { key: 'actions', label: 'Actions', sortable: false, filterable: false },
  ];

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tableData = tables.map(table => ({
    ...table,
    status: getStatusBadge(table.status),
    createdAt: formatDate(table.createdAt),
    actions: (
      <div className="flex gap-3">
        <div className="relative group">
          <button
            className="text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setModalProps({ isOpen: true, mode: 'edit', table })}
          >
            <FaEdit />
          </button>
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Edit
          </span>
        </div>

        <div className="relative group">
          <button
            className="text-red-600 hover:text-red-800 transition-colors"
            onClick={() => {
              setModalProps({ isOpen: false, mode: '', table });
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
        <h2 className="text-2xl font-bold text-gray-800">Table Management</h2>
        <button
          onClick={() => setModalProps({ isOpen: true, mode: 'create', table: null })}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          Add New Table
        </button>
      </div>

      <CustomTable columns={columns} data={tableData} pageSize={10} />

      <AddOrModifyTable
        visible={modalProps.isOpen}
        table={modalProps.table}
        onCancel={() => setModalProps({ isOpen: false, mode: 'create', table: null })}
      />

      <CustomDeleteModal
        visible={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteTable}
      />
    </div>
  );
};

export default TableManagement;