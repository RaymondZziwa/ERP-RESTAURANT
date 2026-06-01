import React, { useState, useEffect } from 'react';
import CustomNumberInput from '../../../custom/inputs/customNumberInput';
import { apiRequest } from '../../../libs/apiConfig';
import CustomButton from '../../../custom/buttons/customButton';
import { toast } from 'sonner';
import type { ITable } from '../../../redux/types/table';
import useTables from '../../../hooks/sales/useTables';
import { SALESENDPOINTS } from '../../../endpoints/sales/salesEndpoints';

interface AddOrModifyTableProps {
  visible: boolean;
  table: ITable | null;
  onCancel: () => void;
}

const AddOrModifyTable: React.FC<AddOrModifyTableProps> = ({
  visible,
  table,
  onCancel,
}) => {
  const { refresh: refreshTables } = useTables();
  const [formData, setFormData] = useState({
    number: 0,
    status: 'AVAILABLE',
  });

  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number || 0,
        status: table.status || 'AVAILABLE',
      });
    } else {
      setFormData({
        number: 0,
        status: 'AVAILABLE',
      });
    }
  }, [table]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.number || formData.number <= 0) {
      toast.error("Please enter a valid table number");
      return;
    }


    try {
      const payload = {
        number: formData.number,
        status: formData.status,
      };

      const endpoint = table
        ? SALESENDPOINTS.TABLE.modify(table.id)
        : SALESENDPOINTS.TABLE.create;

      const method = table ? 'PUT' : 'POST';
      
      await apiRequest(endpoint, method, '', payload);
      
      setFormData({
        number: 0,
        status: 'AVAILABLE',
      });
      
      refreshTables();
      onCancel();
      //toast.success(table ? 'Table updated successfully' : 'Table created successfully');
    } catch (error: any) {
      //toast.error(error?.response?.data?.message || 'Something went wrong');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {table ? 'Edit Table' : 'Add New Table'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Number *
            </label>
            <CustomNumberInput
              value={formData.number}
              onChange={(val) => setFormData(prev => ({ ...prev, number: val }))}
              placeholder="Enter table number"
              min={1}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <CustomButton type='negative' fn={onCancel} label="Cancel" />
            <CustomButton
              type='positive'
              label={table ? 'Update Table' : 'Create Table'}
              fn={handleSubmit}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrModifyTable;