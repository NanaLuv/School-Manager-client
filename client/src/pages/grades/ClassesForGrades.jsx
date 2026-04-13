import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAcademicData } from "../../hooks/useAcademicContext"; 
import api from "../../components/axiosconfig/axiosConfig";

const ClassesForGrades = () => {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const navigate = useNavigate();

  // Use the academic data hook
  const {
    academicYears,
    terms,
    selectedAcademicYear,
    selectedTerm,
    handleAcademicYearChange,
    handleTermChange,
    loading: academicLoading,
    error: academicError,
    getSelectedAcademicYear,
    getSelectedTerm
  } = useAcademicData();

  // Fetch classes when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchClassesWithStats();
    } else {
      setClasses([]);
      setLoadingClasses(false);
    }
  }, [selectedAcademicYear]);

  const fetchClassesWithStats = async () => {
    setLoadingClasses(true);
    try {
      const response = await api.get(
        "/getclasses"
      );
      
      const classesWithStats = await Promise.all(
        response.data.map(async (classItem) => {
          try {
            const studentsResponse = await api.get(
              `/getclasses/${classItem.id}/students`
            );
            
            // Also fetch grades for this class and academic year
            const gradesResponse = await api.get(
              `/getgrades?class_id=${classItem.id}&academic_year_id=${selectedAcademicYear}`
            );

            const studentCount =
              studentsResponse.data.students?.length ||
              studentsResponse.data.active_student_count ||
              studentsResponse.data.total_current_students ||
              0;
            
            const gradeCount = gradesResponse.data.length || 0;
            const hasGrades = gradeCount > 0;

            return {
              ...classItem,
              studentCount: studentCount,
              gradeCount: gradeCount,
              hasGrades: hasGrades,
              current_student_count: studentsResponse.data.current_student_count,
              active_student_count: studentsResponse.data.active_student_count,
            };
          } catch (error) {
            console.error(
              `Error fetching data for class ${classItem.class_name}:`,
              error
            );
            return {
              ...classItem,
              studentCount: 0,
              gradeCount: 0,
              hasGrades: false,
              current_student_count: 0,
              active_student_count: 0,
            };
          }
        })
      );
      
      setClasses(classesWithStats);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
    setLoadingClasses(false);
  };

  const handleClassClick = (classItem) => {
    // Pass both academic year and term to the next page
    navigate(`/academics/grades/class/${classItem.id}`, {
      state: {
        classData: classItem,
        academicYearId: selectedAcademicYear,
        termId: selectedTerm
      },
    });
  };

  const getAcademicYearLabel = () => {
    const year = getSelectedAcademicYear();
    return year ? year.year_label : "No Year Selected";
  };

  const getTermLabel = () => {
    const term = getSelectedTerm();
    return term ? term.term_name : "No Term Selected";
  };

  // Show loading while academic data loads
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Scores Management
          </h1>
          <p className="text-gray-600">
            Select a class to manage student scores
          </p>
        </div>

        {/* Academic Year and Term Filters */}
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

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AcademicCapIcon className="w-5 h-5 text-blue-500 mr-2" />
          <div>
            <p className="text-blue-700">
              <strong>Academic Year:</strong> {getAcademicYearLabel()}
              {selectedTerm && (
                <span className="ml-2">
                  <strong>• Term:</strong> {getTermLabel()}
                </span>
              )}
            </p>
            <p className="text-blue-700 mt-1">
              <strong>How it works:</strong> Select a year and term, then click on any class to view and manage grades for students
            </p>
          </div>
        </div>
      </div>

      {/* Warning if no academic year selected */}
      {!selectedAcademicYear && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-700">
            ⚠️ Please select an academic year to view classes and manage grades.
          </p>
        </div>
      )}

      {/* Loading indicator for classes */}
      {selectedAcademicYear && loadingClasses && (
        <div className="text-center py-8">
          <LoadingSpinner text="Loading classes and grade data..." />
        </div>
      )}

      {/* Classes Grid */}
      {selectedAcademicYear && !loadingClasses && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Classes for {getAcademicYearLabel()}
              {selectedTerm && ` - Term ${getTermLabel()}`}
            </h2>
            <span className="text-sm text-gray-500">
              {classes.length} classes found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                onClick={() => handleClassClick(classItem)}
                className="bg-white rounded-lg shadow border hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
              >
                <div className="p-6">
                  {/* Class Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {classItem.class_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {classItem.room_number || "No room assigned"}
                      </p>
                    </div>
                    {classItem.hasGrades && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Has Grades
                      </span>
                    )}
                  </div>

                  {/* Class Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserGroupIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Students</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {classItem.studentCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Grade Records</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {classItem.gradeCount}
                      </span>
                    </div>

                    {classItem.capacity && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity</span>
                        <span className="text-sm font-medium text-gray-900">
                          {classItem.studentCount}/{classItem.capacity}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar for Capacity */}
                  {classItem.capacity && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (classItem.studentCount / classItem.capacity) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button className="w-full mt-4 bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 transition-colors text-sm font-medium">
                    Enter Scores
                  </button>
                </div>
              </div>
            ))}
          </div>

          {classes.length === 0 && (
            <div className="text-center py-12">
              <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Classes Found
              </h3>
              <p className="text-gray-500 mb-4">
                There are no classes available for the selected academic year.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                Refresh Data
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassesForGrades;