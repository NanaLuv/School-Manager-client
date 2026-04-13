// components/classes/ClassTeacherForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const ClassTeacherForm = ({ assignment, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    class_id: "",
    teacher_id: "",
    is_main_teacher: false,
  });
  const [classes, setClasses] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (assignment) {
      setFormData({
        class_id: assignment.class_id || "",
        teacher_id: assignment.teacher_id || "",
        is_main_teacher: assignment.is_main_teacher || false,
      });
    }
  }, [assignment]);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const [classesResponse, teachersResponse] = await Promise.all([
        axios.get("http://localhost:3001/schmgt/getclasses"),
        axios.get("http://localhost:3001/schmgt/getavailableteachers"),
      ]);

      setClasses(classesResponse.data);
      setAvailableTeachers(teachersResponse.data);
      console.log("fetched teachers:", teachersResponse.data)
    } catch (error) {
      console.error("Error fetching form data:", error);
    }
    setLoading(false);
  };

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.class_id) {
      newErrors.class_id = "Class is required";
    }
    if (!formData.teacher_id) {
      newErrors.teacher_id = "Teacher is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class *
        </label>
        <select
          name="class_id"
          value={formData.class_id}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.class_id ? "border-red-500" : "border-gray-300"
          }`}
          disabled={!!assignment} // Cannot change class when editing
        >
          <option value="">Select Class</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.class_name}
              {classItem.room_number && ` (${classItem.room_number})`}
            </option>
          ))}
        </select>
        {errors.class_id && (
          <p className="text-red-500 text-sm mt-1">{errors.class_id}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teacher *
        </label>
        <select
          name="teacher_id"
          value={formData.teacher_id}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.teacher_id ? "border-red-500" : "border-gray-300"
          }`}
          disabled={!!assignment} // Cannot change teacher when editing
        >
          <option value="">Select Teacher</option>
          {availableTeachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.first_name} {teacher.last_name}
              {teacher.employee_id && ` (${teacher.employee_id})`}
              {teacher.specialization && ` - ${teacher.specialization}`}
            </option>
          ))}
        </select>
        {errors.teacher_id && (
          <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>
        )}
        {availableTeachers.length === 0 && !assignment && (
          <p className="text-yellow-600 text-sm mt-1">
            No available teachers. All teachers are already assigned to classes
            for the current academic year.
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_main_teacher"
          checked={formData.is_main_teacher}
          onChange={handleChange}
          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Set as Main Class Teacher
        </label>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          About Main Teachers:
        </h4>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Each class can have only one main teacher per academic year</li>
          <li>
            Main teachers are typically responsible for overall class management
          </li>
        </ul>
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
          disabled={availableTeachers.length === 0 && !assignment}
        >
          {assignment ? "Update Assignment" : "Assign Teacher"}
        </button>
      </div>
    </form>
  );
};

export default ClassTeacherForm;
