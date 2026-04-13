import React, { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SubjectAssignmentForm from "../../components/subjects/SubjectAssignmentForm";
import SubjectAssignmentTable from "../../components/subjects/SubjectAssignmentTable";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const SubjectAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const getData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, subjectsRes, teachersRes, classesRes, yearsRes] =
        await Promise.all([
          api.get("/getsubjectassignments"),
          api.get("/getsubjects"),
          api.get("/getteachers"),
          api.get("/getclasses"),
          api.get("/getacademicyearsforsubjectassignment"),
        ]);

      setAssignments(assignmentsRes.data);
      setSubjects(subjectsRes.data);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data);
      setAcademicYears(yearsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, []);

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await api.delete(`/deletesubjectassignment/${assignmentId}`);
        getData();
      } catch (error) {
        console.error("Error deleting assignment:", error);
      }
    }
  };

  const handleSaveAssignment = async (assignmentData) => {
    try {
      if (editingAssignment) {
        await api.put(
          `/updatesubjectassignment/${editingAssignment.id}`,
          assignmentData,
        );
      } else {
        await api.post("/createsubjectassignment", assignmentData);
      }
      setIsModalOpen(false);
      getData();
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading subject assignments..." />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Subject Assignments
          </h1>
          <p className="text-gray-600">
            Assign subjects to classes and teachers
          </p>
        </div>
        <button
          onClick={handleAddAssignment}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Total Assignments</p>
          <p className="text-2xl font-bold text-gray-900">
            {assignments.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Active Teachers</p>
          <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Subjects</p>
          <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Classes</p>
          <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow">
        <SubjectAssignmentTable
          assignments={assignments}
          subjects={subjects}
          teachers={teachers}
          classes={classes}
          academicYears={academicYears}
          onEdit={handleEditAssignment}
          onDelete={handleDeleteAssignment}
          emptyMessage="No subject assignments found. Click 'New Assignment' to create the first one."
        />
      </div>

      {/* Add/Edit Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? "Edit Assignment" : "Create New Assignment"}
        size="large"
      >
        <SubjectAssignmentForm
          assignment={editingAssignment}
          subjects={subjects}
          teachers={teachers}
          classes={classes}
          academicYears={academicYears}
          onSave={handleSaveAssignment}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default SubjectAssignments;
