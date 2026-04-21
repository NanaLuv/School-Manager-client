
import React, { useState, useEffect } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import { AcademicCapIcon, DocumentTextIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import api from "../axiosconfig/axiosConfig";

const ReportCardPreview = ({ classId, academicYearId, termId }) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [gradingScales, setGradingScales] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState({});
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (classId && academicYearId && termId) {
      fetchPreviewData();
    }
  }, [classId, academicYearId, termId]);

  const fetchPreviewData = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel
      const [studentsRes, scalesRes, subjectsRes] = await Promise.all([
        api.get(`/getclasses/${classId}/students`),
        api.get("/getgradingscales"),
        api.get("/getsubjects")
      ]);

      setStudents(studentsRes.data.students || []);
      setGradingScales(scalesRes.data || []);
      setSubjects(subjectsRes.data || []);

      // Auto-select first student
      if (studentsRes.data.students?.length > 0) {
        setSelectedStudent(studentsRes.data.students[0].id);
      }
    } catch (error) {
      console.error("Error fetching preview data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedStudent && academicYearId && termId) {
      fetchStudentGrades(selectedStudent);
    }
  }, [selectedStudent, academicYearId, termId]);

  const fetchStudentGrades = async (studentId) => {
    try {
      const response = await api.get(
        `/getgrades?student_id=${studentId}&academic_year_id=${academicYearId}&term_id=${termId}`
      );

      const grades = response.data || [];
      
      // Calculate grades and remarks using grading scales
      const gradesWithCalculations = grades.map(grade => {
        const totalScore = parseFloat(grade.class_score || 0) + parseFloat(grade.exam_score || 0);
        
        // Find matching grading scale
        const scale = gradingScales.find(s => 
          totalScore >= s.min_score && totalScore <= s.max_score
        );
        
        return {
          ...grade,
          subject_total: totalScore,
          grade: scale?.grade || "N/A",
          remarks: scale?.remarks || "No grade"
        };
      });

      setStudentGrades(prev => ({
        ...prev,
        [studentId]: gradesWithCalculations
      }));
      
      // Prepare preview data
      const student = students.find(s => s.id == studentId);
      if (student) {
        setPreviewData({
          student,
          grades: gradesWithCalculations,
          totalSubjects: gradesWithCalculations.length,
          averageScore: gradesWithCalculations.length > 0 
            ? gradesWithCalculations.reduce((sum, g) => sum + (parseFloat(g.subject_total) || 0), 0) / gradesWithCalculations.length
            : 0
        });
      }
    } catch (error) {
      console.error("Error fetching student grades:", error);
    }
  };

  const calculateGradeAndRemarks = (score) => {
    if (!score && score !== 0) return { grade: "N/A", remarks: "No score" };
    
    const numericScore = parseFloat(score);
    const scale = gradingScales.find(s => 
      numericScore >= s.min_score && numericScore <= s.max_score
    );
    
    return {
      grade: scale?.grade || "N/A",
      remarks: scale?.remarks || "No grade",
      points: scale?.grade_points || 0
    };
  };

  if (loading) {
    return <LoadingSpinner text="Loading preview data..." />;
  }

  if (!classId || !academicYearId || !termId) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded">
        <p className="text-amber-700">Please select class, academic year, and term to preview report cards.</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-700">No students found in this class for the selected academic period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <DocumentTextIcon className="w-5 h-5 mr-2" />
        Report Card Preview
      </h3>

      {/* Student Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Student to Preview
        </label>
        <select
          value={selectedStudent || ""}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.first_name} {student.last_name} ({student.admission_number})
            </option>
          ))}
        </select>
      </div>

      {/* Preview Content */}
      {previewData && (
        <div className="border rounded-lg p-4">
          {/* Student Header */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h4 className="font-medium text-gray-900">
                {previewData.student.first_name} {previewData.student.last_name}
              </h4>
              <span className="ml-2 text-sm text-gray-500">
                ({previewData.student.admission_number})
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <AcademicCapIcon className="w-4 h-4 mr-1" />
              <span>{previewData.grades.length} subjects with grades</span>
            </div>
          </div>

          {/* Grades Table */}
          {previewData.grades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Subject</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Class Score</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Exam Score</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Total</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Grade</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.grades.map((grade) => {
                    const gradeInfo = calculateGradeAndRemarks(grade.subject_total);
                    return (
                      <tr key={grade.subject_id}>
                        <td className="px-3 py-2">
                          {subjects.find(s => s.id == grade.subject_id)?.subject_name || grade.subject_id}
                        </td>
                        <td className="px-3 py-2">{parseFloat(grade.class_score || 0).toFixed(1)}</td>
                        <td className="px-3 py-2">{parseFloat(grade.exam_score || 0).toFixed(1)}</td>
                        <td className="px-3 py-2 font-medium">
                          {parseFloat(grade.subject_total || 0).toFixed(1)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            gradeInfo.grade === 'A' ? 'bg-green-100 text-green-800' :
                            gradeInfo.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            gradeInfo.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            gradeInfo.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                            gradeInfo.grade === 'F' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {gradeInfo.grade}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {gradeInfo.remarks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      Average Score: <span className="font-medium">{previewData.averageScore.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Total Subjects: <span className="font-medium">{previewData.totalSubjects}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No grades found for this student.</p>
              <p className="text-sm text-gray-400 mt-1">
                Scores need to be entered before report cards can be generated.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <p className="font-medium mb-1">Note:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>This preview shows calculated grades based on entered scores</li>
          <li>Grades are calculated using the current grading scales</li>
          <li>Final report cards will include attendance, comments, and ranking</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportCardPreview;