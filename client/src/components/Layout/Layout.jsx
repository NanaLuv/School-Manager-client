// frontend/src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import { useAuth } from "../../pages/contexts/AuthContext";
import Topbar from "../sidebar/Topbar";
const Layout = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-auto p-2 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;