import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, UserIcon } from "@heroicons/react/24/outline";

const StudentForm = ({
  student,
  classes,
  loadingClasses,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    parent_name: "",
    parent_contact: "",
    parent_email: "",
    address: "",
    enrolled_date: new Date().toISOString().split("T")[0], // Default to today in correct format
    has_fee_block: false,
    is_active: true,
    photo: null,
  });

  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Helper function to convert ISO date to yyyy-MM-dd format
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    // If it's already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // If it's an ISO date, convert to yyyy-MM-dd
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (student) {
      // Format dates properly for the input fields
      const formattedEnrolledDate = formatDateForInput(student.enrolled_date);
      const formattedDOB = formatDateForInput(student.date_of_birth);

      setFormData({
        admission_number: student.admission_number || "",
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        date_of_birth: formattedDOB,
        gender: student.gender || "",
        parent_name: student.parent_name || "",
        parent_contact: student.parent_contact || "",
        parent_email: student.parent_email || "",
        address: student.address || "",
        enrolled_date:
          formattedEnrolledDate || new Date().toISOString().split("T")[0],
        class_id: student.class_id || "", // Set current class if exists
        has_fee_block: student.has_fee_block || false,
        is_active: student.is_active !== false,
        photo: null,
      });

      // Set preview if student has a photo
      if (student.photo_filename) {
        setPreviewUrl(
          `http://localhost:3001/uploads/students/${student.photo_filename}`
        );
      } else {
        setPreviewUrl("");
      }
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          photo: "Please select a valid image file (JPEG, PNG, GIF)",
        }));
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: "Image size should be less than 2MB",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, photo: file }));
      setErrors((prev) => ({ ...prev, photo: "" }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.admission_number.trim()) {
      newErrors.admission_number = "Admission number is required";
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    if (!formData.parent_name.trim()) {
      newErrors.parent_name = "Parent/Guardian name is required";
    }
    if (!formData.parent_contact.trim()) {
      newErrors.parent_contact = "Parent contact is required";
    }
    if (!formData.enrolled_date) {
      newErrors.enrolled_date = "Enrollment date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Create FormData to handle file upload
      const submitData = new FormData();

      // Append all form fields with proper boolean conversion
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          if (key === "photo" && formData[key] instanceof File) {
            submitData.append(key, formData[key]);
          } else if (key === "has_fee_block" || key === "is_active") {
            // Convert booleans to integers (1 or 0) for MySQL
            submitData.append(key, formData[key] ? "1" : "0");
          } else {
            submitData.append(key, formData[key]);
          }
        }
      });

      // If editing and no new photo, ensure we keep the existing photo
      if (student && !formData.photo && student.photo_filename) {
        submitData.append("existing_photo", student.photo_filename);
      }

      onSave(submitData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-h-96 overflow-y-auto"
    >
      {/* Photo Upload Section */}
      <div className="border-b pb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Student Photo
        </label>
        <div className="flex items-center space-x-6">
          {/* Photo Preview */}
          <div className="flex-shrink-0">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Student preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                <UserIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/jpeg,image/jpg,image/png,image/gif"
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer"
            >
              Choose Photo
            </label>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG or GIF (Max 2MB). Recommended: Square photo, 500x500
              pixels
            </p>
            {errors.photo && (
              <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admission Number *
          </label>
          <input
            type="text"
            name="admission_number"
            value={formData.admission_number}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.admission_number ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., ADM001"
          />
          {errors.admission_number && (
            <p className="text-red-500 text-sm mt-1">
              {errors.admission_number}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enrollment Date *
          </label>
          <input
            type="date"
            name="enrolled_date"
            value={formData.enrolled_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.enrolled_date ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.enrolled_date && (
            <p className="text-red-500 text-sm mt-1">{errors.enrolled_date}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.first_name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter first name"
          />
          {errors.first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.last_name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter last name"
          />
          {errors.last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Assignment
        </label>
        <select
          name="class_id"
          value={formData.class_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={loadingClasses}
        >
          <option value="">Select Class</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.class_name}
              {classItem.room_number && ` (Room: ${classItem.room_number})`}
            </option>
          ))}
        </select>
        {loadingClasses && (
          <p className="text-xs text-gray-500 mt-1">Loading classes...</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Student will be assigned to this class for the current academic year
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.date_of_birth ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.date_of_birth && (
            <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.gender ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent/Guardian Name *
          </label>
          <input
            type="text"
            name="parent_name"
            value={formData.parent_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.parent_name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter parent/guardian name"
          />
          {errors.parent_name && (
            <p className="text-red-500 text-sm mt-1">{errors.parent_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Contact *
          </label>
          <input
            type="text"
            name="parent_contact"
            value={formData.parent_contact}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.parent_contact ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Phone number or email"
          />
          {errors.parent_contact && (
            <p className="text-red-500 text-sm mt-1">{errors.parent_contact}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent email *
          </label>
          <input
            type="text"
            name="parent_email"
            value={formData.parent_email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.parent_email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Phone number or email"
          />
          {errors.parent_email && (
            <p className="text-red-500 text-sm mt-1">{errors.parent_email}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Enter student's address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* <div className="flex items-center">
          <input
            type="checkbox"
            name="has_fee_block"
            checked={formData.has_fee_block}
            onChange={handleChange}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Fee Block (restrict access due to unpaid fees)
          </label>
        </div> */}

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Active Student
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
        >
          {student ? "Update Student" : "Add Student"}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
