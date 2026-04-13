import React, { useState, useEffect } from "react";

const SubjectAssignmentForm = ({
  assignment,
  subjects,
  teachers,
  classes,
  academicYears,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    subject_id: "",
    class_id: "",
    teacher_id: "",
    academic_year_id: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (assignment) {
      setFormData({
        subject_id: assignment.subject_id || "",
        class_id: assignment.class_id || "",
        teacher_id: assignment.teacher_id || "",
        academic_year_id: assignment.academic_year_id || "",
      });
    }
  }, [assignment]);

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

    if (!formData.subject_id) {
      newErrors.subject_id = "Please select a subject";
    }
    if (!formData.class_id) {
      newErrors.class_id = "Please select a class";
    }
    if (!formData.teacher_id) {
      newErrors.teacher_id = "Please select a teacher";
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

  const getCurrentYear = academicYears.find((year) => year.is_current);

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
                {cls.class_name} {cls.room_number ? `(${cls.room_number})` : ""}
              </option>
            ))}
          </select>
          {errors.class_id && (
            <p className="text-red-500 text-sm mt-1">{errors.class_id}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <select
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.subject_id ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subject_name} ({subject.subject_code})
              </option>
            ))}
          </select>
          {errors.subject_id && (
            <p className="text-red-500 text-sm mt-1">{errors.subject_id}</p>
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
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.first_name} {teacher.last_name} -{" "}
                {teacher.specialization}
              </option>
            ))}
          </select>
          {errors.teacher_id && (
            <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This assignment will link the selected subject
          to the class and assign a teacher to teach it for the chosen academic
          year.
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
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
        >
          {assignment ? "Update Assignment" : "Create Assignment"}
        </button>
      </div>
    </form>
  );
};

export default SubjectAssignmentForm;
