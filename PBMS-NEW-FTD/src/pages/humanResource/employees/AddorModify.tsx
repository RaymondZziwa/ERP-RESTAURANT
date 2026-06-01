import React, { useState, useEffect } from 'react';
import CustomTextInput from '../../../custom/inputs/customTextInput';
import { apiRequest } from '../../../libs/apiConfig';
import CustomButton from '../../../custom/buttons/customButton';
import { toast } from 'sonner';
import CustomDropdown from '../../../custom/inputs/customDropdown';
import useBranches from '../../../hooks/settings/useBranches';
import useDepartments from '../../../hooks/humanResource/useDepartments';
import type { IEmployee } from '../../../redux/types/hr';
import useRoles from '../../../hooks/settings/useRoles';
import { EmployeeEndpoints } from '../../../endpoints/humanResource/employee';
import useEmployees from '../../../hooks/humanResource/useEmployees';

interface AddorModifyEmployeeProps {
  visible: boolean;
  Employee: IEmployee | null; // Changed from Department to Employee
  onCancel: () => void;
}

const AddorModifyEmployee: React.FC<AddorModifyEmployeeProps> = ({
  visible,
  Employee,
  onCancel
}) => {
  const { data: branches } = useBranches();
  const { data: departments } = useDepartments();
  const { data: roles } = useRoles();
  const {refresh} = useEmployees()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    email: '',
    tel: '',
    password: '',
    salary: '',
    hasAccess: false,
    hasPrescriptionAccess: false,
    isActive: true,
    roleId: '',
    branchId: '',
    deptId: ''
  });

  // Update form data when Employee prop changes (for editing)
  useEffect(() => {
    if (Employee) {
      setFormData({
        firstName: Employee.firstName || '',
        lastName: Employee.lastName || '',
        gender: Employee.gender || '',
        email: Employee.email || '',
        tel: Employee.tel || '',
        password: '', // Don't pre-fill password for security
        salary: Employee.salary?.toString() || '',
        hasAccess: Employee.hasAccess || false,
        hasPrescriptionAccess: Employee.hasPrescriptionAccess || false,
        isActive: Employee.isActive !== undefined ? Employee.isActive : true,
        roleId: Employee.roleId?.toString() || '',
        branchId: Employee.branchId?.toString() || '',
        deptId: Employee.deptId?.toString() || ''
      });
    } else {
      // Reset form for new employee
      setFormData({
        firstName: '',
        lastName: '',
        gender: '',
        email: '',
        tel: '',
        password: '',
        salary: '',
        hasAccess: false,
        hasPrescriptionAccess: false,
        isActive: true,
        roleId: '',
        branchId: '',
        deptId: ''
      });
    }
  }, [Employee]);

  // Handler for dropdown changes
  const handleDropdownChange = (field: string) => (selectedIds: string[]) => {
    const value = selectedIds.length > 0 ? selectedIds[0] : '';
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handler for input changes
  const handleInputChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handler for checkbox changes
  const handleCheckboxChange = (field: string) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim()) {
      toast.error("Please enter first name");
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("Please enter last name");
      return;
    }
    if (!formData.gender) {
      toast.error("Please select gender");
      return;
    }
    if (!formData.tel.trim()) {
      toast.error("Please enter phone number");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter employee email");
      return;
    }
     if (!formData.deptId || (typeof formData.deptId === 'string' && !formData.deptId.trim())) {
      toast.error("Please assign a department to the new employee");
      return;
     }

     if (!formData.branchId || (typeof formData.branchId === 'string' && !formData.branchId.trim())) {
      toast.error("Please assign the new employee to a branch");
      return;
    }
    if (!Employee && !formData.password) { // Only require password for new employees
      toast.error("Please enter password");
      return;
    }
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      toast.error("Please enter a valid salary");
      return;
    }
    if (!formData.roleId) {
      toast.error("Please select a role");
      return;
    }

    try {
      // Prepare payload according to DTO
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        email: formData.email.trim() || undefined, // Optional field
        tel: formData.tel.trim(),
        password: formData.password, // For new employees or password updates
        salary: formData.salary,
        hasAccess: formData.hasAccess,
        hasPrescriptionAccess: formData.hasPrescriptionAccess,
        isActive: formData.isActive,
        roleId: Number(formData.roleId),
        branchId: formData.branchId ? Number(formData.branchId) : undefined, // Optional field
        deptId: formData.deptId ? Number(formData.deptId) : undefined // Optional field
      };

      // Remove password field if editing and password is empty (not changing password)
      if (Employee && !formData.password) {
        delete payload.password;
      }

      const endpoint = Employee ?
        EmployeeEndpoints.updateEmployee(Employee?.id) :
        EmployeeEndpoints.createEmployee;
        
      
      const method = Employee ? "PATCH" : "POST";
      
      await apiRequest(endpoint, method, '', payload);
      
      refresh()
      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        gender: '',
        email: '',
        tel: '',
        password: '',
        salary: '',
        hasAccess: false,
        hasPrescriptionAccess: false,
        isActive: true,
        roleId: '',
        branchId: '',
        deptId: ''
      });
      
      onCancel();
      
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${Employee ? 'update' : 'create'} employee`);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {Employee ? 'Edit Employee' : 'Add New Employee'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Personal Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <CustomTextInput
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <CustomTextInput
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <CustomDropdown
                  options={[
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' },
                  ]}
                  value={formData.gender ? [formData.gender] : []}
                  onChange={handleDropdownChange('gender')}
                  placeholder="Select gender"
                  singleSelect={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <CustomTextInput
                  type="tel"
                  value={formData.tel}
                  onChange={handleInputChange('tel')}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <CustomTextInput
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="Enter email"
                />
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Employment Information</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <CustomDropdown
                  options={roles?.map(role => ({
                    label: role.name,
                    value: role.id.toString()
                  })) || []}
                  value={formData.roleId ? [formData.roleId] : []}
                  onChange={handleDropdownChange('roleId')}
                  placeholder="Select role"
                  singleSelect={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <CustomDropdown
                  options={departments?.map(dept => ({
                    label: `${dept.name} - ${dept.branch.name}`,
                    value: dept.id.toString()
                  })) || []}
                  value={formData.deptId ? [formData.deptId] : []}
                  onChange={handleDropdownChange('deptId')}
                  placeholder="Select department"
                  singleSelect={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <CustomDropdown
                  options={branches?.map(branch => ({
                    label: branch.name,
                    value: branch.id.toString()
                  })) || []}
                  value={formData.branchId ? [formData.branchId] : []}
                  onChange={handleDropdownChange('branchId')}
                  placeholder="Select branch"
                  singleSelect={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary *
                </label>
                <CustomTextInput
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange('salary')}
                  placeholder="Enter salary"
                />
              </div>

              {!Employee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <CustomTextInput
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder="Enter password"
                  />
                </div>
              )}

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasAccess}
                    onChange={(e) => handleCheckboxChange('hasAccess')(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Has System Access</span>
                </label>
                {/* <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasPrescriptionAccess}
                    onChange={(e) => handleCheckboxChange('hasPrescriptionAccess')(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Has Prescription Database Access</span>
                </label> */}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleCheckboxChange('isActive')(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active Employee</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <CustomButton type='negative' fn={onCancel}/>
            <CustomButton autoCloseModal={onCancel} label={Employee ? 'Update Employee' : 'Create Employee'} fn={handleSubmit}/>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddorModifyEmployee;