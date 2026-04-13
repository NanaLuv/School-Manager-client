import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  BanknotesIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import * as XLSX from "xlsx";
import api from "../../components/axiosconfig/axiosConfig";

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  useEffect(() => {
    fetchStaff();
    fetchCategories();
  }, [currentPage, searchTerm]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "/payroll/getstaff",
        {
          params: {
            page: currentPage,
            limit: 10,
            search: searchTerm,
          },
        }
      );

      setStaff(response.data.staff || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get(
        "/payroll/categories"
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Create default categories if needed
      setCategories([
        { id: 1, category_name: "Teacher" },
        { id: 2, category_name: "Administrator" },
        { id: 3, category_name: "Accountant" },
        { id: 4, category_name: "Janitor" },
        { id: 5, category_name: "Security" },
      ]);
    }
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    setIsAddModalOpen(true);
  };

  const handleBulkImport = () => {
    setIsBulkImportModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        staff_number: "EMP001",
        first_name: "John",
        last_name: "Doe",
        category: "Teacher",
        employment_date: "2024-01-15",
        contact_phone: "0551234567",
        bank_name: "GCB Bank",
        bank_account_number: "1234567890",
        bank_branch: "Accra Main",
        mobile_money_number: "0551234567",
        mobile_money_provider: "MTN",
        emergency_contact: "Jane Doe",
        emergency_phone: "0557654321",
      },
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Generate file
    XLSX.writeFile(workbook, "staff_import_template.xlsx");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validate and map data
      const staffData = jsonData
        .map((row) => ({
          staff_number: row.staff_number || row["Staff Number"],
          first_name: row.first_name || row["First Name"],
          last_name: row.last_name || row["Last Name"],
          category_id: getCategoryIdByName(row.category || row["Category"]),
          employment_date: row.employment_date || row["Employment Date"],
          contact_phone: row.contact_phone || row["Contact Phone"],
          bank_name: row.bank_name || row["Bank Name"],
          bank_account_number: row.bank_account_number || row["Account Number"],
          bank_branch: row.bank_branch || row["Bank Branch"],
          mobile_money_number: row.mobile_money_number || row["Mobile Money"],
          mobile_money_provider:
            row.mobile_money_provider || row["Mobile Provider"],
          emergency_contact: row.emergency_contact || row["Emergency Contact"],
          emergency_phone: row.emergency_phone || row["Emergency Phone"],
        }))
        .filter((staff) => staff.first_name && staff.last_name); // Remove empty rows

      try {
        // Send bulk data to backend
        const response = await api.post(
          "/payroll/bulk-import",
          {
            staff: staffData,
          }
        );

        alert(`Successfully imported ${response.data.imported} staff members`);
        setIsBulkImportModalOpen(false);
        fetchStaff();
      } catch (error) {
        console.error("Error importing staff:", error);
        alert("Failed to import staff. Please check the file format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getCategoryIdByName = (categoryName) => {
    const category = categories.find(
      (cat) => cat.category_name.toLowerCase() === categoryName?.toLowerCase()
    );
    return category ? category.id : 1; // Default to first category if not found
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setIsAddModalOpen(true);
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await api.delete(
          `/payroll/staff/${staffId}`
        );
        fetchStaff();
      } catch (error) {
        console.error("Error deleting staff:", error);
        alert("Failed to delete staff member");
      }
    }
  };

  const handleSaveStaff = async (staffData) => {
    try {
      if (editingStaff) {
        await api.put(
          `/payroll/staff/${editingStaff.id}`,
          staffData
        );
      } else {
        await api.post(
          "/payroll/addstaff",
          staffData
        );
      }
      setIsAddModalOpen(false);
      fetchStaff();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Failed to save staff member");
    }
  };

  const exportStaff = () => {
    const exportData = staff.map((s) => ({
      "Staff ID": s.staff_number,
      Name: `${s.first_name} ${s.last_name}`,
      Category: s.category_name,
      Phone: s.contact_phone,
      Bank: s.bank_name,
      Account: s.bank_account_number,
      "Mobile Money": s.mobile_money_number,
      Employed: new Date(s.employment_date).toLocaleDateString(),
      Status: s.is_active ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff");
    XLSX.writeFile(
      workbook,
      `staff_export_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  if (loading) return <LoadingSpinner text="Loading staff..." />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Staff Members</h2>
          <p className="text-sm text-gray-600">
            Total: {staff.length} staff members
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportStaff}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button
            onClick={handleBulkImport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={handleAddStaff}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search staff by name or staff number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((staffMember) => (
          <div
            key={staffMember.id}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {staffMember.first_name} {staffMember.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {staffMember.staff_number}
                </p>
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {staffMember.category_name}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditStaff(staffMember)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteStaff(staffMember.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="w-4 h-4 mr-2" />
                <span>{staffMember.contact_phone || "No phone"}</span>
              </div>

              {staffMember.bank_name && (
                <div className="flex items-center text-sm text-gray-600">
                  <BanknotesIcon className="w-4 h-4 mr-2" />
                  <span>
                    {staffMember.bank_name} ••••
                    {staffMember.bank_account_number?.slice(-4)}
                  </span>
                </div>
              )}

              {staffMember.mobile_money_number && (
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  <span>
                    Mobile: {staffMember.mobile_money_number} (
                    {staffMember.mobile_money_provider})
                  </span>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Employed since{" "}
                {new Date(staffMember.employment_date).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    staffMember.is_active ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {staffMember.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingStaff ? "Edit Staff Member" : "Add New Staff"}
        size="large"
      >
        <StaffForm
          staff={editingStaff}
          categories={categories}
          onSave={handleSaveStaff}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        title="Bulk Import Staff"
        size="medium"
      >
        <BulkImportForm
          onDownloadTemplate={handleDownloadTemplate}
          onFileUpload={handleFileUpload}
          onCancel={() => setIsBulkImportModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

// Staff Form Component with Category Dropdown
const StaffForm = ({ staff, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    staff || {
      staff_number: "",
      first_name: "",
      last_name: "",
      category_id: categories[0]?.id || "",
      employment_date: new Date().toISOString().split("T")[0],
      contact_phone: "",
      bank_name: "",
      bank_account_number: "",
      bank_branch: "",
      mobile_money_number: "",
      mobile_money_provider: "MTN",
      emergency_contact: "",
      emergency_phone: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[70vh] overflow-y-auto p-1"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Staff Number *
          </label>
          <input
            type="text"
            value={formData.staff_number}
            onChange={(e) =>
              setFormData({ ...formData, staff_number: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="EMP001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={formData.category_id}
            onChange={(e) =>
              setFormData({ ...formData, category_id: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Date *
          </label>
          <input
            type="date"
            value={formData.employment_date}
            onChange={(e) =>
              setFormData({ ...formData, employment_date: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Phone *
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) =>
              setFormData({ ...formData, contact_phone: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="0551234567"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Bank Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) =>
                setFormData({ ...formData, bank_name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="GCB Bank"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={formData.bank_account_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bank_account_number: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Branch
            </label>
            <input
              type="text"
              value={formData.bank_branch}
              onChange={(e) =>
                setFormData({ ...formData, bank_branch: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Accra Main"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Mobile Money
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Money Number
            </label>
            <input
              type="text"
              value={formData.mobile_money_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mobile_money_number: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0551234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Money Provider
            </label>
            <select
              value={formData.mobile_money_provider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mobile_money_provider: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MTN">MTN</option>
              <option value="Vodafone">Vodafone</option>
              <option value="AirtelTigo">AirtelTigo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Name
            </label>
            <input
              type="text"
              value={formData.emergency_contact}
              onChange={(e) =>
                setFormData({ ...formData, emergency_contact: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Phone
            </label>
            <input
              type="tel"
              value={formData.emergency_phone}
              onChange={(e) =>
                setFormData({ ...formData, emergency_phone: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {staff ? "Update Staff" : "Add Staff"}
        </button>
      </div>
    </form>
  );
};

// Bulk Import Form Component
const BulkImportForm = ({ onDownloadTemplate, onFileUpload, onCancel }) => {
  const [uploadStatus, setUploadStatus] = useState("");

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Download the template file</li>
          <li>Fill in staff information</li>
          <li>Save as Excel file (.xlsx)</li>
          <li>Upload the completed file</li>
          <li>
            Categories should match exactly (Teacher, Administrator, etc.)
          </li>
        </ul>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Upload your Excel file</p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-2">
          Only Excel files (.xlsx, .xls) are accepted
        </p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Download Template
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div
          className={`p-3 rounded-lg ${
            uploadStatus.includes("Success")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {uploadStatus}
        </div>
      )}
    </div>
  );
};

export default StaffList;
