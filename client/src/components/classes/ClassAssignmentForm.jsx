import React, { useState, useEffect } from "react";

const ClassAssignmentForm = ({
  assignment,
  students,
  classes,
  academicYears,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    student_id: "",
    class_id: "",
    academic_year_id: "",
    promotion_status: "Pending",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (assignment) {
      setFormData({
        student_id: assignment.student_id || "",
        class_id: assignment.class_id || "",
        academic_year_id: assignment.academic_year_id || "",
        promotion_status: assignment.promotion_status || "Pending",
      });
    } else {
      // Set default to current academic year
      const currentYear = academicYears.find((year) => year.is_current);
      if (currentYear) {
        setFormData((prev) => ({
          ...prev,
          academic_year_id: currentYear.id,
        }));
      }
    }
  }, [assignment, academicYears]);

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

    if (!formData.student_id) {
      newErrors.student_id = "Please select a student";
    }
    if (!formData.class_id) {
      newErrors.class_id = "Please select a class";
    }
    if (!formData.academic_year_id) {
      newErrors.academic_year_id = "Please select an academic year";
    }

    // Check if student is already enrolled in this class for the selected year
    const existingAssignment = students
      .find((s) => s.id == formData.student_id)
      ?.assignments?.find(
        (a) =>
          a.academic_year_id == formData.academic_year_id &&
          a.class_id == formData.class_id
      );

    if (existingAssignment && !assignment) {
      newErrors.student_id =
        "This student is already enrolled in this class for the selected academic year";
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

  // Get unassigned students for selected academic year
  const getAvailableStudents = () => {
    if (!formData.academic_year_id) return students;

    return students.filter((student) => {
      const hasAssignment = assignment?.some(
        (assignment) =>
          assignment.student_id === student.id &&
          assignment.academic_year_id == formData.academic_year_id
      );
      return !hasAssignment;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            Promotion Status
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student *
          </label>
          <select
            name="student_id"
            value={formData.student_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.student_id ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select Student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
                {student.admission_number
                  ? ` (${student.admission_number})`
                  : ""}
              </option>
            ))}
          </select>
          {errors.student_id && (
            <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>
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
                {cls.capacity ? ` (Capacity: ${cls.capacity})` : ""}
                {cls.room_number ? ` - ${cls.room_number}` : ""}
              </option>
            ))}
          </select>
          {errors.class_id && (
            <p className="text-red-500 text-sm mt-1">{errors.class_id}</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This will enroll the student in the selected
          class for the academic year. Each student can only be in one class per
          academic year.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        {/* explanatory section to the form, right before the submit
        buttons */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            📚 Understanding Class Enrollment
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Academic Year Enrollment:</strong> This placement lasts
              the entire academic year (all terms).
            </p>
            <p>
              <strong>Term Transitions:</strong> Students automatically continue
              in the same class for all terms within this year.
            </p>
            <p>
              <strong>Promotion:</strong> Only happens at the end of the
              academic year to move to the next class level.
            </p>
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
        >
          {assignment ? "Update Assignment" : "Enroll Student"}
        </button>
      </div>
    </form>
  );
};

export default ClassAssignmentForm;
