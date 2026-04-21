// ProfitLoss.jsx - FIXED VERSION
import React, { useState, useEffect, useRef } from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import api from "../../components/axiosconfig/axiosConfig";

// Import Recharts conditionally to avoid SSR issues
let Recharts;
if (typeof window !== "undefined") {
  Recharts = require("recharts");
}

const ProfitLoss = () => {
  const [loading, setLoading] = useState(true);
  const [plData, setPlData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [chartsLoaded, setChartsLoaded] = useState(false);

  // Refs for chart containers
  const chartContainerRef = useRef(null);

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState(new Date());
  const [period, setPeriod] = useState("monthly");
  const [includeDetails, setIncludeDetails] = useState(true);
  const [timeframe, setTimeframe] = useState("6months");

  // Colors
  const COLORS = {
    income: "#10B981", // Green
    expenses: "#EF4444", // Red
    profit: "#3B82F6", // Blue
    fees: "#8B5CF6", // Purple
    payroll: "#F59E0B", // Amber
    other_income: "#EC4899", // Pink
    other_expenses: "#6B7280", // Gray
  };

  // In your fetchProfitLossData function, update the try-catch block:
  const fetchProfitLossData = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        period,
        include_details: includeDetails,
      };

      const [plResponse, trendsResponse] = await Promise.all([
        api.get("/finance/profit-loss", {
          params,
        }),
        api.get("/finance/profit-loss/trends", {
          params: { timeframe },
        }),
      ]);

      // Check if responses are valid
      if (!plResponse.data || !trendsResponse.data) {
        throw new Error("Invalid response from server");
      }
      setPlData(plResponse.data);
      setTrends(trendsResponse.data);

      // Load charts after data is ready
      setTimeout(() => {
        setChartsLoaded(true);
      }, 100);
    } catch (error) {
      console.error("Error fetching P&L data:", error);

      // Create fallback data structure if API fails
      const fallbackData = {
        summary: {
          total_income: 0,
          total_expenditure: 0,
          profit_loss: 0,
          profit_margin: 0,
          expense_income_ratio: 0,
        },
        income: {
          fees: { total: 0, students: 0, fully_paid: 0, average: 0 },
          cash_receipts: { total: 0, categories: 0, details: [] },
          breakdown: [],
        },
        expenditure: {
          expenses: { total: 0, categories: 0, details: [] },
          payroll: {
            net_total: 0,
            gross_total: 0,
            deductions: 0,
            periods: 0,
            staff: 0,
          },
          breakdown: [],
        },
        metrics: {
          collection: { collected: 0, billed: 0, rate: 0 },
          efficiency: { payroll_percentage: 0, profit_per_student: 0 },
        },
        period: {
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        },
      };

      const fallbackTrends = {
        trends: [],
        summary: {
          avg_monthly_income: 0,
          avg_monthly_expenses: 0,
          avg_monthly_profit: 0,
          profitable_months: 0,
          total_months: 0,
        },
      };

      setPlData(fallbackData);
      setTrends(fallbackTrends);

      // Show error message to user
      alert(
        `Failed to load financial data: ${error.message}. Showing sample data.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLossData();
  }, [timeframe]);

  // Load charts on mount
  useEffect(() => {
    if (plData) {
      setChartsLoaded(true);
    }
  }, [plData]);

  // Handle quick period selection
  const handleQuickPeriod = (days) => {
    const newEndDate = new Date();
    const newStartDate = new Date();
    newStartDate.setDate(newStartDate.getDate() - days);

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setChartsLoaded(false);
    fetchProfitLossData();
  };

  // Export functions
  const exportReport = async (format) => {
    try {
      const params = {
        format,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      const response = await api.get(
        "/finance/profit-loss/export",
        {
          params,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `profit-loss-${startDate.toISOString().split("T")[0]}-to-${
          endDate.toISOString().split("T")[0]
        }.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  if (loading)
    return <LoadingSpinner text="Loading Profit & Loss Analysis..." />;

  if (!plData || !trends)
    return <div className="text-center p-8">No data available</div>;

  // Format currency
  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate summary stats
  const isProfitable = plData.summary.profit_loss > 0;
  const collectionRate = plData.metrics.collection.rate;
  const profitMargin = plData.summary.profit_margin;

  // Helper component to render charts only when loaded
  const ChartContainer = ({ children, height = "h-64" }) => (
    <div className={`${height} min-h-[256px]`} style={{ minWidth: "100%" }}>
      {chartsLoaded && typeof window !== "undefined" && Recharts ? (
        children
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center text-gray-500">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Loading chart...</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="p-6 space-y-6 bg-gray-50 min-h-screen"
      ref={chartContainerRef}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Profit & Loss Dashboard
          </h1>
          <p className="text-gray-600">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportReport("pdf")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export PDF
          </button>
          <button
            onClick={() => exportReport("excel")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setChartsLoaded(false);
                fetchProfitLossData();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full transition-colors font-medium"
            >
              Update Analysis
            </button>
          </div>
        </div>

        {/* Quick Periods */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickPeriod(7)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleQuickPeriod(30)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleQuickPeriod(90)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            Last Quarter
          </button>
          <button
            onClick={() => {
              const firstDay = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
              );
              setStartDate(firstDay);
              setChartsLoaded(false);
              fetchProfitLossData();
            }}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const firstDay = new Date(new Date().getFullYear(), 0, 1);
              setStartDate(firstDay);
              setEndDate(new Date());
              setChartsLoaded(false);
              fetchProfitLossData();
            }}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
          >
            Year to Date
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(plData.summary.total_income)}
              </p>
            </div>
            <div
              className={`p-2 rounded-lg ${
                isProfitable ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <CurrencyDollarIcon
                className={`w-8 h-8 ${
                  isProfitable ? "text-green-600" : "text-red-600"
                }`}
              />
            </div>
          </div>
          <div className="mt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Student Fees</span>
              <span className="font-medium">
                {formatCurrency(plData.income.fees.total)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">Other Income</span>
              <span className="font-medium">
                {formatCurrency(plData.income.cash_receipts.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(plData.summary.total_expenditure)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-red-100">
              <BanknotesIcon className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="mt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payroll</span>
              <span className="font-medium">
                {formatCurrency(plData.expenditure.payroll.net_total)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">Operating</span>
              <span className="font-medium">
                {formatCurrency(plData.expenditure.expenses.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Net Profit/Loss */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Profit/Loss</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  isProfitable ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(plData.summary.profit_loss)}
              </p>
              <p
                className={`text-sm mt-1 ${
                  isProfitable ? "text-green-600" : "text-red-600"
                }`}
              >
                {plData.summary.profit_margin.toFixed(2)}% Margin
              </p>
            </div>
            <div
              className={`p-2 rounded-lg ${
                isProfitable ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isProfitable ? (
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`inline-flex items-center text-sm ${
                isProfitable ? "text-green-600" : "text-red-600"
              }`}
            >
              {isProfitable ? (
                <>
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  Profitable
                </>
              ) : (
                <>
                  <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                  Loss Making
                </>
              )}
            </span>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collection Rate</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  collectionRate >= 80
                    ? "text-green-600"
                    : collectionRate >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {collectionRate.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {plData.income.fees.fully_paid} of {plData.income.fees.students}{" "}
                paid
              </p>
            </div>
            <div
              className={`p-2 rounded-lg ${
                collectionRate >= 80
                  ? "bg-green-100"
                  : collectionRate >= 60
                    ? "bg-yellow-100"
                    : "bg-red-100"
              }`}
            >
              <CheckCircleIcon
                className={`w-8 h-8 ${
                  collectionRate >= 80
                    ? "text-green-600"
                    : collectionRate >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-sm ${
                collectionRate >= 80
                  ? "text-green-600"
                  : collectionRate >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {collectionRate >= 80
                ? "Excellent"
                : collectionRate >= 60
                  ? "Good"
                  : "Needs Improvement"}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Sections */}
      {/* Income Breakdown */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Income Breakdown
        </h3>

        {/* Simple donut chart using SVG */}
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="lg:w-2/5">
            <div className="h-48 flex items-center justify-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="mx-auto"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="#e5e7eb"
                  strokeWidth="40"
                />
                {(() => {
                  let total = plData.income.breakdown.reduce(
                    (sum, item) => sum + parseFloat(item.amount),
                    0,
                  );
                  let accumulated = 0;

                  return plData.income.breakdown.map((item, index) => {
                    const percentage =
                      total > 0 ? (parseFloat(item.amount) / total) * 360 : 0;
                    const offset = accumulated;
                    accumulated += percentage;

                    return (
                      <circle
                        key={index}
                        cx="100"
                        cy="100"
                        r="80"
                        fill="transparent"
                        stroke={
                          Object.values(COLORS)[
                            index % Object.keys(COLORS).length
                          ]
                        }
                        strokeWidth="40"
                        strokeDasharray={`${percentage} ${360 - percentage}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 100 100)"
                      />
                    );
                  });
                })()}
                <text
                  x="100"
                  y="100"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold"
                >
                  {formatCurrency(plData.summary.total_income).replace(
                    "Ghc ",
                    "",
                  )}
                </text>
                <text
                  x="100"
                  y="120"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm text-gray-500"
                >
                  Total
                </text>
              </svg>
            </div>
          </div>

          {/* Income breakdown list */}
          <div className="lg:w-3/5">
            <div className="space-y-2">
              {plData.income.breakdown.map((item, index) => {
                const percentage =
                  plData.summary.total_income > 0
                    ? (parseFloat(item.amount) / plData.summary.total_income) *
                      100
                    : 0;

                return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{
                          backgroundColor:
                            Object.values(COLORS)[
                              index % Object.keys(COLORS).length
                            ],
                        }}
                      ></div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.category}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.transactions} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* SIMPLE VERSION - Expense Breakdown */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Expense Breakdown
        </h3>

        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="lg:w-2/5">
            <div className="h-48 flex items-center justify-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="mx-auto"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="#e5e7eb"
                  strokeWidth="40"
                />
                {(() => {
                  let total = plData.expenditure.breakdown.reduce(
                    (sum, item) => sum + parseFloat(item.amount),
                    0,
                  );
                  let accumulated = 0;

                  return plData.expenditure.breakdown.map((item, index) => {
                    const percentage =
                      total > 0 ? (parseFloat(item.amount) / total) * 360 : 0;
                    const offset = accumulated;
                    accumulated += percentage;
                    const color =
                      item.category === "Payroll"
                        ? COLORS.payroll
                        : COLORS.expenses;

                    return (
                      <circle
                        key={index}
                        cx="100"
                        cy="100"
                        r="80"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="40"
                        strokeDasharray={`${percentage} ${360 - percentage}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 100 100)"
                      />
                    );
                  });
                })()}
                <text
                  x="100"
                  y="100"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold"
                >
                  {formatCurrency(plData.summary.total_expenditure).replace(
                    "Ghc ",
                    "",
                  )}
                </text>
                <text
                  x="100"
                  y="120"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm text-gray-500"
                >
                  Total
                </text>
              </svg>
            </div>
          </div>

          {/* Expense breakdown list */}
          <div className="lg:w-3/5">
            <div className="space-y-2">
              {plData.expenditure.breakdown.map((item, index) => {
                const percentage =
                  plData.summary.total_expenditure > 0
                    ? (parseFloat(item.amount) /
                        plData.summary.total_expenditure) *
                      100
                    : 0;
                const color =
                  item.category === "Payroll"
                    ? COLORS.payroll
                    : COLORS.expenses;

                return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: color }}
                      ></div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.category}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.transactions} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Category Breakdown */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payroll by Category
        </h3>
        <div className="space-y-3">
          {plData.expenditure.payroll_breakdown.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-amber-500 mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    {category.category}
                  </p>
                  <p className="text-sm text-gray-500">
                    {category.staff_count} staff members
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {formatCurrency(category.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  Avg: {formatCurrency(category.avg_salary)}
                </p>
              </div>
            </div>
          ))}

          {/* Payroll Summary */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg mt-4">
            <div>
              <p className="text-sm text-gray-600">Gross Payroll</p>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(plData.expenditure.payroll.gross_total)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deductions</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(plData.expenditure.payroll.deductions_total)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Payroll</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(plData.expenditure.payroll.net_total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Financial Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Payroll Percentage */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Payroll to Income Ratio</p>
            <p className="text-xl font-bold text-blue-700">
              {plData.metrics.efficiency.payroll_percentage.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {plData.expenditure.payroll.staff} staff members
            </p>
          </div>

          {/* Expense Ratio */}
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Expense to Income Ratio</p>
            <p className="text-xl font-bold text-red-700">
              {plData.summary.expense_income_ratio.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Target: {"<"}70%</p>
          </div>

          {/* Profit Per Student */}
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Profit per Student</p>
            <p
              className={`text-xl font-bold ${
                plData.metrics.efficiency.profit_per_student > 0
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {formatCurrency(plData.metrics.efficiency.profit_per_student)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Based on {plData.income.fees.students} paying students
            </p>
          </div>

          {/* Average Transaction */}
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Fee per Student</p>
            <p className="text-xl font-bold text-purple-700">
              {formatCurrency(plData.income.fees.average)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total: {plData.income.fees.students} students
            </p>
          </div>
        </div>
      </div>
      {/* Trend Analysis */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Trend Analysis
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTimeframe("3months");
                setChartsLoaded(false);
              }}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeframe === "3months"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => {
                setTimeframe("6months");
                setChartsLoaded(false);
              }}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeframe === "6months"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => {
                setTimeframe("12months");
                setChartsLoaded(false);
              }}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeframe === "12months"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              12 Months
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Income
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(trends.trends || []).map((trend, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trend.label}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(trend.total_income)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(trend.total_expenses)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${
                        trend.profit_loss > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(trend.profit_loss)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {trend.total_income > 0
                      ? `${(
                          (trend.profit_loss / trend.total_income) *
                          100
                        ).toFixed(2)}%`
                      : "0%"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${
                        trend.income_growth > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {trend.income_growth > 0 ? "+" : ""}
                      {trend.income_growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Trend Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-500">Avg Monthly Income</p>
              <p className="text-sm font-medium">
                {formatCurrency(trends.summary.avg_monthly_income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Monthly Expenses</p>
              <p className="text-sm font-medium">
                {formatCurrency(trends.summary.avg_monthly_expenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Monthly Profit</p>
              <p className="text-sm font-medium">
                {formatCurrency(trends.summary.avg_monthly_profit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Profitable Months</p>
              <p className="text-sm font-medium">
                {trends.summary.profitable_months} /{" "}
                {trends.summary.total_months}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Income vs Expenses Trend
          </h3>
          <ChartContainer>
            {Recharts && (
              <Recharts.ResponsiveContainer
                width="100%"
                height="100%"
                minHeight={256}
              >
                <Recharts.AreaChart
                  data={trends.trends || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                >
                  <Recharts.CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <Recharts.XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <Recharts.YAxis
                    tickFormatter={(value) =>
                      `Ghc ${(value / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 12 }}
                  />
                  <Recharts.Tooltip
                    formatter={(value) => [formatCurrency(value), "Amount"]}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Recharts.Area
                    type="monotone"
                    dataKey="total_income"
                    name="Income"
                    stroke={COLORS.income}
                    fill={COLORS.income}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Recharts.Area
                    type="monotone"
                    dataKey="total_expenses"
                    name="Expenses"
                    stroke={COLORS.expenses}
                    fill={COLORS.expenses}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Recharts.Legend />
                </Recharts.AreaChart>
              </Recharts.ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        {/* Profit/Loss Trend */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Profit/Loss Trend
          </h3>
          <ChartContainer>
            {Recharts && (
              <Recharts.ResponsiveContainer
                width="100%"
                height="100%"
                minHeight={256}
              >
                <Recharts.BarChart
                  data={trends.trends || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                >
                  <Recharts.CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <Recharts.XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <Recharts.YAxis
                    tickFormatter={(value) =>
                      `Ghc ${(value / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 12 }}
                  />
                  <Recharts.Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Profit/Loss",
                    ]}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Recharts.Bar
                    dataKey="profit_loss"
                    name="Profit/Loss"
                    fill={(entry) =>
                      entry.profit_loss > 0 ? COLORS.profit : COLORS.expenses
                    }
                    radius={[4, 4, 0, 0]}
                  />
                  <Recharts.Legend />
                </Recharts.BarChart>
              </Recharts.ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;
