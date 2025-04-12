
import { Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Records from "./pages/Records";
import Profile from "./pages/Profile";
import ApiSettings from "./pages/ApiSettings";
import ServerSettings from "./pages/ServerSettings";
import ServerAutomation from "./pages/ServerAutomation";
import Bookmarklet from "./pages/Bookmarklet";
import PolicyPage from "./pages/PolicyPage";
import ServicePage from "./pages/ServicePage";
import AdminApproval from "./pages/AdminApproval";

// تكوين المسارات للتطبيق
const routes = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgotten-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/upload",
    element: <ProtectedRoute><Index /></ProtectedRoute>,
  },
  {
    path: "/records",
    element: <ProtectedRoute><Records /></ProtectedRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: "/api-settings",
    element: <ProtectedRoute><ApiSettings /></ProtectedRoute>,
  },
  {
    path: "/server-settings",
    element: <ProtectedRoute><ServerSettings /></ProtectedRoute>,
  },
  {
    path: "/server-automation",
    element: <ProtectedRoute><ServerAutomation /></ProtectedRoute>,
  },
  {
    path: "/bookmarklet",
    element: <ProtectedRoute><Bookmarklet /></ProtectedRoute>,
  },
  {
    path: "/privacy",
    element: <PolicyPage />,
  },
  {
    path: "/service",
    element: <ServicePage />,
  },
  {
    path: "/admin",
    element: <ProtectedRoute adminOnly={true}><AdminApproval /></ProtectedRoute>,
  },
  {
    path: "/tasks",
    element: <ProtectedRoute><Records /></ProtectedRoute>,
  },
  {
    path: "404",
    element: <NotFound />,
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
];

export default routes;
