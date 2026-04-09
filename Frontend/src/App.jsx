import React from "react";
import { Outlet, RouterProvider, createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Donors from "./pages/Donors";
import AdminDonorProfile from "./pages/AdminDonorProfile";
import Prospects from "./pages/Prospects";
import Menu from "./components/Menu";
import Hospital from "./pages/Hospital";
import Regional from "./pages/Regional";
import National from "./pages/National";
import SuperAdmin from "./pages/SuperAdmin";
import HospitalApply from "./pages/HospitalApply";
import RequestBlood from "./pages/RequestBlood";
import Donor from "./pages/Donor";
import Login from "./pages/Login";
import BloodRequests from "./pages/BloodRequests";
import {
  ADMIN_ROLES,
  DONOR_ROLES,
  NATIONAL_ROLES,
  REGIONAL_ROLES,
  SUPER_ADMIN_ROLES,
  getAuthSession,
  getDefaultRouteForUser,
  hasRole,
} from "./utils/auth";

function App() {
  const PublicOnlyRoute = ({ children }) => {
    const { user } = getAuthSession();
    return user ? <Navigate to={getDefaultRouteForUser(user)} replace /> : children;
  };

  const RequireAuth = ({ children }) => {
    const { user } = getAuthSession();
    const location = useLocation();

    if (!user) {
      const from = `${location.pathname}${location.search}${location.hash}`;
      return <Navigate to="/login" replace state={{ from }} />;
    }

    return children;
  };

  const RequireRoles = ({ allowedRoles, children }) => {
    const { user } = getAuthSession();

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return hasRole(user, allowedRoles) ? (
      children
    ) : (
      <Navigate to={getDefaultRouteForUser(user)} replace />
    );
  };

  const Layout = () => (
    <div className="flex">
      <Menu />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );

  const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "/home", element: <Home /> },
    {
      path: "/login",
      element: (
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/donor",
      element: (
        <RequireRoles allowedRoles={DONOR_ROLES}>
          <Donor />
        </RequireRoles>
      ),
    },
    {
      path: "/request-blood",
      element: (
        <RequireAuth>
          <RequestBlood />
        </RequireAuth>
      ),
    },
    {
      path: "/hospital-apply",
      element: (
        <RequireAuth>
          <HospitalApply />
        </RequireAuth>
      ),
    },
    {
      path: "/admin",
      element: (
        <RequireRoles allowedRoles={ADMIN_ROLES}>
          <Layout />
        </RequireRoles>
      ),
      children: [
        { path: "/admin", element: <Admin /> },
        { path: "/admin/donors", element: <Donors /> },
        { path: "/admin/donors/:id", element: <AdminDonorProfile /> },
        { path: "/admin/prospects", element: <Prospects /> },
        { path: "/admin/hospital", element: <Hospital /> },
        { path: "/admin/requests", element: <BloodRequests /> },
        {
          path: "/admin/regional",
          element: (
            <RequireRoles allowedRoles={REGIONAL_ROLES}>
              <Regional />
            </RequireRoles>
          ),
        },
        {
          path: "/admin/national",
          element: (
            <RequireRoles allowedRoles={NATIONAL_ROLES}>
              <National />
            </RequireRoles>
          ),
        },
        {
          path: "/admin/super",
          element: (
            <RequireRoles allowedRoles={SUPER_ADMIN_ROLES}>
              <SuperAdmin />
            </RequireRoles>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
