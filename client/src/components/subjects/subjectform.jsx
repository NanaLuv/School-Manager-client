import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const SubjectForm = ({ subject, onSave, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_name: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (subject) {
      setFormData({
        id: subject.id,
        subject_code: subject.subject_code || "",
        subject_name: subject.subject_name || "",
        description: subject.description || "",
      });
    } else {
      // Reset form when adding new subject
      setFormData({
        subject_code: "",
        subject_name: "",
        description: "",
      });
    }
    setErrors({});
  }, [subject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject_code.trim()) {
      newErrors.subject_code = "Subject code is required";
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.subject_code)) {
      newErrors.subject_code =
        "Subject code must be 3-10 uppercase letters/numbers";
    }

    if (!formData.subject_name.trim()) {
      newErrors.subject_name = "Subject name is required";
    } else if (formData.subject_name.length < 2) {
      newErrors.subject_name = "Subject name must be at least 2 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {subject ? "Edit Subject" : "Create New Subject"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Subject Code */}
        <div>
          <label
            htmlFor="subject_code"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Subject Code *
          </label>
          <div className="relative">
            <input
              type="text"
              id="subject_code"
              name="subject_code"
              value={formData.subject_code}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                errors.subject_code
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 focus:border-emerald-500"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="e.g., MATH101"
              disabled={loading}
              autoFocus
            />
            {!errors.subject_code && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Required
                </span>
              </div>
            )}
          </div>
          {errors.subject_code ? (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <XMarkIcon className="w-4 h-4 mr-1" />
              {errors.subject_code}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Unique code for the subject (3-10 uppercase letters/numbers)
            </p>
          )}
        </div>

        {/* Subject Name */}
        <div>
          <label
            htmlFor="subject_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Subject Name *
          </label>
          <input
            type="text"
            id="subject_name"
            name="subject_name"
            value={formData.subject_name}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
              errors.subject_name
                ? "border-red-300 bg-red-50"
                : "border-gray-300 focus:border-emerald-500"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="e.g., Mathematics"
            disabled={loading}
          />
          {errors.subject_name ? (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <XMarkIcon className="w-4 h-4 mr-1" />
              {errors.subject_name}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Full name of the subject
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${
              errors.description
                ? "border-red-300 bg-red-50"
                : "border-gray-300 focus:border-emerald-500"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="Brief description of the subject, curriculum details, or special notes..."
            disabled={loading}
          />
          <div className="flex justify-between mt-2">
            {errors.description ? (
              <p className="text-sm text-red-600 flex items-center">
                <XMarkIcon className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Provide additional context about the subject
              </p>
            )}
            <span
              className={`text-xs ${
                formData.description.length > 450
                  ? "text-orange-500"
                  : "text-gray-400"
              }`}
            >
              {formData.description.length}/500
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-emerald-500 border border-transparent rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{subject ? "Updating..." : "Creating..."}</span>
              </>
            ) : (
              <span>{subject ? "Update Subject" : "Create Subject"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;
