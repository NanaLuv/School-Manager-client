// pages/GradingScalesList.js
import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import GradingScalesTable from "../../components/grades/GradingScalesTable";
import GradingScaleForm from "../../components/grades/GradingScaleForm";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const GradingScalesList = () => {
  const [gradingScales, setGradingScales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [editingScale, setEditingScale] = useState(null);
  const [calculatorScore, setCalculatorScore] = useState("");
  const [calculatedGrade, setCalculatedGrade] = useState(null);

  const getGradingScales = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "/getgradingscales"
      );
      setGradingScales(response.data);
    } catch (error) {
      console.error("Error fetching grading scales:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getGradingScales();
  }, []);

  const handleAddScale = () => {
    setEditingScale(null);
    setIsModalOpen(true);
  };

  const handleEditScale = (scale) => {
    setEditingScale(scale);
    setIsModalOpen(true);
  };

  const handleDeleteScale = async (scaleId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this grading scale? This may affect existing grade calculations."
      )
    ) {
      try {
        await api.delete(
          `/deletegradingscale/${scaleId}`
        );
        getGradingScales();
      } catch (error) {
        console.error("Error deleting grading scale:", error);
        alert(
          "Error deleting grading scale: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  const handleSaveScale = async (scaleData) => {
    try {
      if (editingScale) {
        await api.put(
          `/updategradingscale/${editingScale.id}`,
          scaleData
        );
      } else {
        await api.post(
          "/creategradingscale",
          scaleData
        );
      }
      setIsModalOpen(false);
      getGradingScales();
    } catch (error) {
      console.error("Error saving grading scale:", error);
      alert(
        "Error saving grading scale: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleCalculateGrade = async () => {
    if (!calculatorScore || calculatorScore < 0 || calculatorScore > 100) {
      alert("Please enter a valid score between 0 and 100");
      return;
    }

    try {
      const response = await api.get(
        `/calculategrade/${calculatorScore}`
      );
      setCalculatedGrade(response.data);
    } catch (error) {
      console.error("Error calculating grade:", error);
      setCalculatedGrade(null);
      alert("No grade found for this score. Please check your grading scales.");
    }
  };

  // Calculate statistics
  const totalScales = gradingScales.length;
  const hasCompleteRange =
    gradingScales.length > 0 &&
    gradingScales[0].max_score === 100 &&
    gradingScales[gradingScales.length - 1].min_score === 0;

  if (loading) {
    return <LoadingSpinner text="Loading grading scales..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Grading Scales Management
          </h1>
          <p className="text-gray-600">
            Define and manage the school's grading system
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            <CalculatorIcon className="w-5 h-5" />
            <span>Grade Calculator</span>
          </button>
          <button
            onClick={handleAddScale}
            className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Scale</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Scales</p>
              <p className="text-2xl font-bold text-gray-900">{totalScales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Score Range</p>
              <p className="text-2xl font-bold text-green-600">0 - 100</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div>
            <p className="text-sm text-gray-600">Range Coverage</p>
            <p
              className={`text-lg font-bold ${
                hasCompleteRange ? "text-green-600" : "text-orange-600"
              }`}
            >
              {hasCompleteRange ? "Complete" : "Incomplete"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {hasCompleteRange
                ? "Full 0-100 coverage"
                : "Missing score ranges"}
            </p>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          About Grading Scales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <p>
              <strong>How it works:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Define score ranges for each grade (A, B, C, etc.)</li>
              <li>Set grade points for GPA calculation</li>
              <li>Add remarks for each grade level</li>
            </ul>
          </div>
          <div>
            <p>
              <strong>Requirements:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Score ranges must not overlap</li>
              <li>Cover full 0-100 score range</li>
              <li>Each grade must be unique</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grading Scales Table */}
      <div className="bg-white rounded-lg shadow">
        <GradingScalesTable
          gradingScales={gradingScales}
          onEdit={handleEditScale}
          onDelete={handleDeleteScale}
          emptyMessage="No grading scales defined. Click 'Add Scale' to create the first one."
        />
      </div>

      {/* Add/Edit Grading Scale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingScale ? "Edit Grading Scale" : "Add New Grading Scale"}
        size="medium"
      >
        <GradingScaleForm
          scale={editingScale}
          onSave={handleSaveScale}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Grade Calculator Modal */}
      <Modal
        isOpen={isCalculatorOpen}
        onClose={() => {
          setIsCalculatorOpen(false);
          setCalculatorScore("");
          setCalculatedGrade(null);
        }}
        title="Grade Calculator"
        size="small"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={calculatorScore}
              onChange={(e) => setCalculatorScore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 85.5"
            />
          </div>

          <button
            onClick={handleCalculateGrade}
            className="w-full bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 transition-colors"
          >
            Calculate Grade
          </button>

          {calculatedGrade && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Result:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Score:</span>
                  <p className="font-medium">{calculatorScore}</p>
                </div>
                <div>
                  <span className="text-gray-600">Grade:</span>
                  <p className="font-medium text-lg">{calculatedGrade.grade}</p>
                </div>
                <div>
                  <span className="text-gray-600">Grade Points:</span>
                  <p className="font-medium">{calculatedGrade.grade_points}</p>
                </div>
                <div>
                  <span className="text-gray-600">Remarks:</span>
                  <p className="font-medium">{calculatedGrade.remarks}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default GradingScalesList;
