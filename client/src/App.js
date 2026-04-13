import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SubjectList from "./pages/subjects/subjects";
import TeacherList from "./pages/teachers/teachers";
import YearTermSettings from "./pages/year-terms/YearTermSettings";
import SubjectAssignments from "./pages/subjects/SubjectAssignment";
import ClassesList from "./pages/classes/ClassesList";
import ClassAssignments from "./pages/classes/ClassAssignments";
import StudentsList from "./pages/students/StudentList";
import ClassDetails from "./components/classes/ClassDetails";
import ClassTeachersList from "./pages/classes/ClassTeacherList";
import GradingScalesList from "./pages/grades/GradingScalesList";
import ClassesForGrades from "./pages/grades/ClassesForGrades";
import ClassGrades from "./pages/grades/ClassGrades";
import ReportCardsList from "./pages/report cards/ReportCardsList";
import GenerateReportCards from "./pages/report cards/GenerateReportCards";
import ViewReportCard from "./pages/report cards/ViewReportCard";
import AttendanceList from "./pages/attendance/AttendanceList";
import TakeAttendance from "./pages/attendance/TakeAttendance";
import AttendanceReports from "./pages/attendance/AttendaceReports";
import FeeCategories from "./pages/fees/FeeCategories";
import BillTemplates from "./pages/fees/BillTemplates";
import StudentBills from "./pages/fees/StudentBills";
import StudentBillSelection from "./pages/fees/StudentBillSelection";
import ArrearsManagement from "./pages/fees/ArrearsManagement";
import ReceivePayment from "./pages/recieve-payments/ReceivePayment";
import ReceiptsManagement from "./pages/receipts/ReceiptsManagement";
import FinancialRecords from "./pages/financials/FinancialRecords";
import DailyCashIntake from "./pages/DailyPayments/DailyCashIntake";
import ExpensesManagement from "./pages/Expenses/ExpensesManagement";
import SchoolSettings from "./pages/schoolsettings/SchoolSettings";
import { AcademicProvider } from "./hooks/useAcademicContext";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login";
import UserRegistration from "./pages/account/UserRegistration";
import { AuthProvider } from "./pages/contexts/AuthContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/protectedRoutes/ProtectedRoutes";
import Profile from "./pages/profile/Profile";
import PayrollDashboard from "./pages/payroll/PayrollDashboard";
import ProfitLoss from "./pages/profit and loss/ProfitLoss";
import UserActivityLogs from "./pages/user activity logs/userActivityLogs";
import EmailLogs from "./pages/emaillogs/EmailLogs";

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Single Router wrapping everything */}
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Wrap all protected routes inside AcademicProvider */}
          <Route
            path="/*"
            element={
              <AcademicProvider>
                <ProtectedAppRoutes />
              </AcademicProvider>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
const ProtectedAppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/homepage"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      />
      {/* Default redirect */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
      <Route
        path="profile"
        element={
          <ProtectedRoute
            requiredRoles={["admin", "teacher", "student", "accountant"]}
          >
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/accounts"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <UserRegistration />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subjects/list"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <SubjectList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teachers/list"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <TeacherList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/year-term-settings"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <YearTermSettings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/subjects-assignments"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <SubjectAssignments />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes/list"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <ClassesList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes/:id"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <ClassDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes/assignments"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <ClassAssignments />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students-lists"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <StudentsList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes/teachers"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <ClassTeachersList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/grading-scales"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <GradingScalesList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/grades"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <ClassesForGrades />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/grades/class/:classId"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <ClassGrades />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/report-cards"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <ReportCardsList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/report-cards/generate"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <GenerateReportCards />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/report-cards/view/:id"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <ViewReportCard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/attendance"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <AttendanceList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/attendance/take"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <TakeAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/academics/attendance/reports"
        element={
          <ProtectedRoute requiredRoles={["admin", "teacher"]}>
            <Layout>
              <AttendanceReports />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/fee-categories"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <FeeCategories />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/classbills"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <BillTemplates />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/student-bills"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <StudentBills />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/select-bills"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <StudentBillSelection />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/arrears"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <ArrearsManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/receive-payment"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <ReceivePayment />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/receipts-management"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <ReceiptsManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance/reports"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <FinancialRecords />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/daily-payments"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <DailyCashIntake />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <ExpensesManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payroll-dashboard"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <PayrollDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profit-loss"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <ProfitLoss />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/school-settings"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <SchoolSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity-logs"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Layout>
              <UserActivityLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/email-logs"
        element={
          <ProtectedRoute requiredRoles={["admin", "accountant"]}>
            <Layout>
              <EmailLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
export default App;
