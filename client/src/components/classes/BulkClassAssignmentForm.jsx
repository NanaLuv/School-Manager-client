import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const BulkClassAssignmentForm = ({
  students,
  classes,
  academicYears,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    student_ids: [],
    class_id: "",
    academic_year_id: "",
    promotion_status: "Pending",
  });

  const [errors, setErrors] = useState({});
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (academicYears.length > 0) {
      const currentYear = academicYears.find((year) => year.is_current);
      if (currentYear) {
        setFormData((prev) => ({
          ...prev,
          academic_year_id: currentYear.id,
        }));
      }
    }
  }, [academicYears]);

  // Filter available students based on selected academic year
  useEffect(() => {
    if (formData.academic_year_id) {
      const filtered = students.filter((student) => {
        // Check if student already has assignment for this year
        const hasAssignment = students.some(
          (s) =>
            s.id === student.id &&
            s.assignments?.some(
              (a) => a.academic_year_id == formData.academic_year_id
            )
        );
        return !hasAssignment && student.is_active !== false;
      });
      setAvailableStudents(filtered);
    } else {
      setAvailableStudents(students.filter((s) => s.is_active !== false));
    }
  }, [formData.academic_year_id, students]);

  // Filter students by search term
  const filteredStudents = availableStudents.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.admission_number?.toLowerCase().includes(searchLower)
    );
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "academic_year_id") {
      // Clear selected students when academic year changes
      setFormData((prev) => ({ ...prev, student_ids: [] }));
      setSelectAll(false);
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleStudentSelection = (studentId) => {
    setFormData((prev) => {
      const isSelected = prev.student_ids.includes(studentId);
      if (isSelected) {
        return {
          ...prev,
          student_ids: prev.student_ids.filter((id) => id !== studentId),
        };
      } else {
        return {
          ...prev,
          student_ids: [...prev.student_ids, studentId],
        };
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setFormData((prev) => ({
        ...prev,
        student_ids: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        student_ids: filteredStudents.map((student) => student.id),
      }));
    }
    setSelectAll(!selectAll);
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.student_ids.length === 0) {
      newErrors.student_ids = "Please select at least one student";
    }
    if (!formData.class_id) {
      newErrors.class_id = "Please select a class";
    }
    if (!formData.academic_year_id) {
      newErrors.academic_year_id = "Please select an academic year";
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

  const getSelectedClassInfo = () => {
    return classes.find((cls) => cls.id == formData.class_id);
  };

  const classInfo = getSelectedClassInfo();
  const selectedCount = formData.student_ids.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Academic Year and Class Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year *
          </label>
          <select
            name="academic_year_id"
            value={formData.academic_year_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.academic_year_id ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year_label} {year.is_current ? "(Current)" : ""}
              </option>
            ))}
          </select>
          {errors.academic_year_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.academic_year_id}
            </p>
          )}
        </div>

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
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
                {cls.capacity
                  ? ` (${cls.current_student_count || 0}/${cls.capacity})`
                  : ""}
                {cls.room_number ? ` - ${cls.room_number}` : ""}
              </option>
            ))}
          </select>
          {errors.class_id && (
            <p className="text-red-500 text-sm mt-1">{errors.class_id}</p>
          )}
        </div>
      </div>

      {/* Class Info Box */}
      {classInfo && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                {classInfo.class_name}
              </h4>
              <div className="text-sm text-blue-700 space-y-1 mt-1">
                {classInfo.capacity && (
                  <p>
                    <strong>Capacity:</strong>{" "}
                    {classInfo.current_student_count || 0}/{classInfo.capacity}{" "}
                    students
                    {selectedCount > 0 && (
                      <span className="ml-2">
                        → {classInfo.current_student_count + selectedCount}/
                        {classInfo.capacity} after enrollment
                      </span>
                    )}
                  </p>
                )}
                {classInfo.room_number && (
                  <p>
                    <strong>Room:</strong> {classInfo.room_number}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-800">
                {selectedCount}
              </div>
              <div className="text-sm text-blue-600">students selected</div>
            </div>
          </div>
        </div>
      )}

      {/* Student Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Students *
            </label>
            <p className="text-sm text-gray-500">
              {availableStudents.length} students available for enrollment
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Select All Button */}
            <button
              type="button"
              onClick={handleSelectAll}
              className={`px-3 py-1 text-sm rounded-md ${
                selectAll
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {selectAll ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>

        {errors.student_ids && (
          <p className="text-red-500 text-sm mb-2">{errors.student_ids}</p>
        )}

        {/* Student List */}
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? "No students match your search"
                  : "No students available for enrollment"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const isSelected = formData.student_ids.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleStudentSelection(student.id)}
                      className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-emerald-50" : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.admission_number &&
                                `Adm: ${student.admission_number}`}
                              {student.gender && ` • ${student.gender}`}
                            </p>
                          </div>
                          <div className="text-right">
                            {student.class_name && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                Current: {student.class_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-500">
          {selectedCount > 0 && (
            <p>
              <strong>{selectedCount}</strong> student
              {selectedCount !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      </div>

      {/* Promotion Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Promotion Status (for all selected students)
        </label>
        <select
          name="promotion_status"
          value={formData.promotion_status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="Pending">Pending</option>
          <option value="Promoted">Promoted</option>
          <option value="Not Promoted">Not Promoted</option>
          <option value="Conditional">Conditional</option>
        </select>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <UserGroupIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Bulk Enrollment Information
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  All selected students will be enrolled in the same class for
                  the entire academic year
                </li>
                <li>Each student can only be in one class per academic year</li>
                <li>
                  Students already enrolled in this academic year will be
                  skipped
                </li>
                <li>Class capacity will be checked before enrollment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formData.student_ids.length === 0}
          className={`px-4 py-2 rounded-md transition-colors ${
            formData.student_ids.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="w-5 h-5" />
            <span>
              Enroll {selectedCount} Student{selectedCount !== 1 ? "s" : ""}
            </span>
          </div>
        </button>
      </div>
    </form>
  );
};

export default BulkClassAssignmentForm;
