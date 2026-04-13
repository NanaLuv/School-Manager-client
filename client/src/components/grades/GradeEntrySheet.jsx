// components/grades/GradeEntrySheet.js
import React, { useState, useEffect } from "react";
import { EyeIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import api from "../axiosconfig/axiosConfig";

const GradeEntrySheet = ({
  classId,
  students,
  subjects,
  terms,
  academicYearId,
  onSave,
}) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [existingGrades, setExistingGrades] = useState({});

  // Set default term
  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0].id);
    }
  }, [terms, selectedTerm]);

  // Load existing grades when subject or term changes
  useEffect(() => {
    if (selectedSubject && selectedTerm) {
      loadExistingGrades();
    } else {
      setExistingGrades({});
      initializeEmptyGrades();
    }
  }, [selectedSubject, selectedTerm, students]);

  const loadExistingGrades = async () => {
    try {
      const response = await api.get(
        `/getgrades?class_id=${classId}&subject_id=${selectedSubject}&term_id=${selectedTerm}&academic_year_id=${academicYearId}`
      );

      const existing = {};
      response.data.forEach((grade) => {
        existing[grade.student_id] = {
          class_score: grade.class_score,
          exam_score: grade.exam_score,
        };
      });
      setExistingGrades(existing);
      initializeGradesWithExisting(existing);
    } catch (error) {
      console.error("Error loading existing grades:", error);
      initializeEmptyGrades();
    }
  };

  const initializeEmptyGrades = () => {
    const emptyGrades = {};
    students.forEach((student) => {
      emptyGrades[student.id] = {
        class_score: "",
        exam_score: "",
      };
    });
    setGrades(emptyGrades);
  };

  const initializeGradesWithExisting = (existing) => {
    const newGrades = {};
    students.forEach((student) => {
      if (existing[student.id]) {
        newGrades[student.id] = { ...existing[student.id] };
      } else {
        newGrades[student.id] = {
          class_score: "",
          exam_score: "",
        };
      }
    });
    setGrades(newGrades);
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const validateGrades = () => {
    for (const studentId in grades) {
      const studentGrades = grades[studentId];

      // Check if at least one score is provided
      if (studentGrades.class_score || studentGrades.exam_score) {
        const classScore = parseFloat(studentGrades.class_score) || 0;
        const examScore = parseFloat(studentGrades.exam_score) || 0;

        if (classScore < 0 || examScore < 0) {
          alert("Scores cannot be negative");
          return false;
        }

        // Fix: These should be 50, not 100 (as per your UI labels)
        if (classScore > 50 || examScore > 50) {
          alert("Class and Exam scores cannot exceed 50");
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!selectedSubject || !selectedTerm) {
      alert("Please select both subject and term");
      return;
    }

    if (!validateGrades()) {
      return;
    }

    setSaving(true);
    try {
      const gradesToSave = [];
      const currentUserId = 1; // This should come from your auth context

      for (const studentId in grades) {
        const studentGrades = grades[studentId];

        // Only save if at least one score is provided and not empty
        if (
          studentGrades.class_score !== "" ||
          studentGrades.exam_score !== ""
        ) {
          gradesToSave.push({
            student_id: parseInt(studentId),
            subject_id: parseInt(selectedSubject),
            academic_year_id: parseInt(academicYearId),
            term_id: parseInt(selectedTerm),
            class_score: parseFloat(studentGrades.class_score) || 0,
            exam_score: parseFloat(studentGrades.exam_score) || 0,
            maximum_score: 100, // Keep this as 100 for total
            grade_date: new Date().toISOString().split("T")[0],
            notes: "Entered via grade sheet",
            entered_by: currentUserId,
          });
        }
      }

      if (gradesToSave.length === 0) {
        alert(
          "No grades to save. Please enter scores for at least one student."
        );
        return;
      }

      // Use bulk endpoint for better performance
      const response = await api.post(
        "/createbulkgrades",
        {
          grades: gradesToSave,
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        alert(
          `Saved ${response.data.success} grades, but ${response.data.errors.length} failed. Check console for details.`
        );
        console.error("Grade errors:", response.data.errors);
      } else {
        alert(`Successfully saved ${response.data.success} grade records`);
      }

      onSave(); // Refresh parent component
      loadExistingGrades(); // Reload existing grades to update status
    } catch (error) {
      console.error("Error saving grades:", error);
      alert(
        "Error saving grades: " + (error.response?.data?.error || error.message)
      );
    }
    setSaving(false);
  };

  const getStudentGradeStatus = (studentId) => {
    const studentGrade = grades[studentId];
    const hasClassScore = studentGrade.class_score !== "";
    const hasExamScore = studentGrade.exam_score !== "";
    const hasExisting = existingGrades[studentId];

    if (hasExisting) return "existing";
    if (hasClassScore || hasExamScore) return "new";
    return "empty";
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Subject Selection */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Grade Entry Sheet
          </h3>
          <button
            onClick={handleSave}
            disabled={saving || !selectedSubject || !selectedTerm}
            className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <EyeIcon className="w-5 h-5" />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subject_name} ({subject.subject_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term *
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.term_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      {selectedSubject && selectedTerm ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Score (50%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam Score (50%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => {
                const studentGrade = grades[student.id] || {
                  class_score: "",
                  exam_score: "",
                };
                const classScore = parseFloat(studentGrade.class_score) || 0;
                const examScore = parseFloat(studentGrade.exam_score) || 0;
                const totalScore = classScore + examScore;
                const status = getStudentGradeStatus(student.id);

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-800 font-medium text-xs">
                            {student.first_name?.[0]}
                            {student.last_name?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {student.admission_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={studentGrade.class_score}
                        onChange={(e) =>
                          handleGradeChange(
                            student.id,
                            "class_score",
                            e.target.value
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="0-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={studentGrade.exam_score}
                        onChange={(e) =>
                          handleGradeChange(
                            student.id,
                            "exam_score",
                            e.target.value
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="0-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          totalScore >= 80
                            ? "text-green-600"
                            : totalScore >= 60
                            ? "text-blue-600"
                            : totalScore >= 50
                            ? "text-orange-600"
                            : totalScore > 0
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        {totalScore > 0 ? totalScore.toFixed(1) : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status === "existing" && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Saved
                        </span>
                      )}
                      {status === "new" && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Unsaved
                        </span>
                      )}
                      {status === "empty" && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Empty
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select Subject and Term
          </h3>
          <p className="text-gray-500">
            Please select a subject and term to start entering grades
          </p>
        </div>
      )}

      {/* Footer Stats */}
      {selectedSubject && selectedTerm && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Students: <strong>{students.length}</strong> • With grades:{" "}
              <strong>
                {
                  Object.values(grades).filter(
                    (g) => g.class_score || g.exam_score
                  ).length
                }
              </strong>{" "}
              • Saved: <strong>{Object.keys(existingGrades).length}</strong>
            </div>
            <div>
              Subject:{" "}
              <strong>
                {subjects.find((s) => s.id == selectedSubject)?.subject_name}
              </strong>{" "}
              • Term:{" "}
              <strong>
                {terms.find((t) => t.id == selectedTerm)?.term_name}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeEntrySheet;
