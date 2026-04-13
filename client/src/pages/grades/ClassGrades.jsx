import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import GradeEntrySheet from "../../components/grades/GradeEntrySheet";
import GradeImport from "../../components/grades/GradeImport";
import axios from "axios";
import { useAcademicData } from "../../hooks/useAcademicContext";
import api from "../../components/axiosconfig/axiosConfig";

const ClassGrades = () => {
  const { classId } = useParams();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classData, setClassData] = useState(null);
  
  // Use academic data hook
  const {
    selectedAcademicYear,
    selectedTerm,
    academicYears,
    terms,
    loading: academicLoading,
    error: academicError,
    getSelectedAcademicYear,
    getSelectedTerm,
    handleAcademicYearChange,
    handleTermChange
  } = useAcademicData();

  // Initialize from location state if available
  useEffect(() => {
    if (location.state) {
      setClassData(location.state.classData);
      // Don't set academicYearId from state - use the hook's selection
    }
  }, [location.state]);

  // Fetch data when academic year, term, or class changes
  useEffect(() => {
    if (selectedAcademicYear && classId) {
      fetchData();
    } else if (classId) {
      // If no academic year selected yet, still fetch basic class info
      fetchClassInfo();
    }
  }, [selectedAcademicYear, selectedTerm, classId]);

  const fetchClassInfo = async () => {
    try {
      const studentsResponse = await api.get(
        `/getclasses/${classId}/students`
      );
      setStudents(studentsResponse.data.students || []);
      setClassData(prev => ({
        ...prev,
        ...studentsResponse.data
      }));
    } catch (error) {
      console.error("Error fetching class info:", error);
    }
  };

  const fetchData = async () => {
    if (!selectedAcademicYear || !classId) return;
    
    setLoading(true);
    try {
      // Get students in this class (for current academic year)
      const studentsResponse = await api.get(
        `/getclasses/${classId}/students`
      );

      // Get subjects assigned to this class for the selected academic year
      const subjectsResponse = await api.get(
        `/getclasssubjects/${classId}/${selectedAcademicYear}`
      );

      setStudents(studentsResponse.data.students || []);
      setSubjects(subjectsResponse.data);
      
      // Update class data with the response
      setClassData(prev => ({
        ...prev,
        ...studentsResponse.data
      }));
    } catch (error) {
      console.error("Error fetching class data:", error);
    }
    setLoading(false);
  };

  const handleGradesSaved = () => {
    // Refresh data
    fetchData();
  };

  const getAcademicYearLabel = () => {
    const year = getSelectedAcademicYear();
    return year ? year.year_label : "No Year Selected";
  };

  const getTermLabel = () => {
    const term = getSelectedTerm();
    return term ? term.term_name : "No Term Selected";
  };

  // Show academic loading
  if (academicLoading) {
    return <LoadingSpinner text="Loading academic data..." />;
  }

  if (academicError) {
    return (
      <div className="p-6 text-red-600">
        <h2 className="text-xl font-bold">Error Loading Academic Data</h2>
        <p>{academicError}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Scores Management - {classData?.class_name || "Class"}
            </h1>
            <p className="text-gray-600">
              Manage scores for students in this class
            </p>
          </div>
          
          {/* Academic Year and Term Selectors */}
          <div className="flex items-center space-x-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Academic Year:
              </label>
              <select
                value={selectedAcademicYear || ""}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                <option value="">Select Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year_label} {year.is_current && "⭐"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Term:
              </label>
              <select
                value={selectedTerm || ""}
                onChange={(e) => handleTermChange(e.target.value)}
                disabled={!selectedAcademicYear}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Selected Info */}
        {selectedAcademicYear && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <AcademicCapIcon className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-blue-700">
                  <strong>Selected:</strong> {getAcademicYearLabel()}
                  {selectedTerm && (
                    <span className="ml-2">
                      • Term {getTermLabel()}
                    </span>
                  )}
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  Entering grades for: {classData?.class_name} • {students.length} students • {subjects.length} subjects
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warning if no academic year selected */}
      {!selectedAcademicYear && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-700">
            ⚠️ Please select an academic year to view and manage grades.
          </p>
        </div>
      )}

      {/* Loading for class data */}
      {selectedAcademicYear && loading && (
        <div className="text-center py-8">
          <LoadingSpinner text="Loading students and subjects..." />
        </div>
      )}

      {/* Stats Overview - Only show when data is loaded */}
      {selectedAcademicYear && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <BookOpenIcon className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subjects.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <AcademicCapIcon className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Academic Year</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {getAcademicYearLabel()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div>
                <p className="text-sm text-gray-600">Room</p>
                <p className="text-lg font-bold text-gray-900">
                  {classData?.room_number || "Not assigned"}
                </p>
              </div>
            </div>
          </div>

          {/* Grade Entry Section - Only show when term is selected */}
          {selectedTerm ? (
            <>
              <div className="mb-6">
                <GradeEntrySheet
                  classId={classId}
                  students={students}
                  subjects={subjects}
                  terms={terms} // Pass all terms for dropdown
                  selectedTerm={selectedTerm} // Pass selected term
                  academicYearId={selectedAcademicYear}
                  onSave={handleGradesSaved}
                />
              </div>
              
              <div className="mt-6">
                <GradeImport
                  classId={classId}
                  subjects={subjects}
                  terms={terms}
                  academicYearId={selectedAcademicYear}
                  selectedTerm={selectedTerm}
                  onImport={fetchData}
                />
              </div>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-700">
                ⚠️ Please select a term to start entering grades.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Select a subject and term to start entering grades</li>
              <li>• Enter class scores (out of 50) and exam scores (out of 50)</li>
              <li>• Total score is automatically calculated</li>
              <li>• Click "Save All Grades" when done with all students</li>
              <li>• Green "Saved" badge shows already recorded grades</li>
              <li>• Current selections: {getAcademicYearLabel()} • Term {getTermLabel()}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ClassGrades;