import React, { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SubjectForm from "../../components/subjects/subjectform";
import SubjectTable from "../../components/subjects/subjectTable";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const SubjectList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const getSubjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/getsubjects");
      setSubjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getSubjects();
  }, []);

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = async (subjectId) => {
    console.log("delete", subjectId);
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await api.delete(`/deletesubject/${subjectId.id}`);
        // const newSubject = response.data;
        // setSubjects(subjects.filter((subject) => subject.id !== subjectId.id));
        getSubjects();
      } catch (error) {
        console.error("Error deleting subject:", error);
      }
      // // API call to delete subject
      // setSubjects(subjects.filter((subject) => subject.id !== subjectId));
    }
  };

  //handle view subject
  const handleViewSubject = (subject) => {
    // Navigate to subject details page
    alert(`Viewing: ${subject.subject_name} (${subject.subject_code})`);
  };

  const handleSaveSubject = async (subjectData) => {
    try {
      if (editingSubject) {
        // Update existing subject
        await api.put(`/updatesubject/${editingSubject.id}`, subjectData);
        setIsModalOpen(false);
        setSubjects(
          subjects.map((subject) =>
            subject.id === editingSubject.id
              ? { ...subject, ...subjectData }
              : subject,
          ),
        );
      } else {
        // Add new subject
        const response = await api.post("/createnewsubject", subjectData);
        const newSubject = response.data;
        setSubjects([...subjects, newSubject]);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading subjects..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Subject Management
          </h1>
          <p className="text-gray-600">Manage all subjects in the school</p>
        </div>
        <button
          onClick={handleAddSubject}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Total Subjects</p>
          <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Active Subjects</p>
          <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-bold text-gray-900">2</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-lg font-semibold text-gray-900">Today</p>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-lg shadow">
        <SubjectTable
          subjects={subjects}
          loading={loading}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
          onView={handleViewSubject}
          emptyMessage="No subjects found. Click 'Add Subject' to create the first one."
        />
      </div>

      {/* Add/Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? "Edit Subject" : "Add New Subject"}
        size="medium"
      >
        <SubjectForm
          subject={editingSubject}
          onSave={handleSaveSubject}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default SubjectList;
