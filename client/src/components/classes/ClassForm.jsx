import React, { useState, useEffect } from "react";

const ClassForm = ({ classItem, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    class_name: "",
    capacity: "",
    room_number: "",
  });

  const [errors, setErrors] = useState({});
  

  useEffect(() => {
    if (classItem) {
      setFormData({
        class_name: classItem.class_name || "",
        capacity: classItem.capacity || "",
        room_number: classItem.room_number || "",
      });
    }
  }, [classItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.class_name.trim()) {
      newErrors.class_name = "Class name is required";
    }
    if (formData.capacity && formData.capacity < 0) {
      newErrors.capacity = "Capacity cannot be negative";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Name *
        </label>
        <input
          type="text"
          name="class_name"
          value={formData.class_name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.class_name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="e.g., Nursery1A, Basic2B"
        />
        {errors.class_name && (
          <p className="text-red-500 text-sm mt-1">{errors.class_name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.capacity ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., 30"
          />
          {errors.capacity && (
            <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Number
          </label>
          <input
            type="text"
            name="room_number"
            value={formData.room_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., Room 101"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
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
          {classItem ? "Update Class" : "Add Class"}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
