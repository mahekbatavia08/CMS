import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import { ROUTES } from "@/constants/routes";

import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";

const Login = lazy(() => import("@/pages/Login/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));
const Projects = lazy(() => import("@/pages/Projects/Projects"));
const MasterProjects = lazy(() => import("@/pages/MasterProjects/MasterProjects"));
const PortfolioProjects = lazy(() => import("@/pages/PortfolioProjects/PortfolioProjects"));
const CreateProject = lazy(() => import("@/pages/CreateProject/CreateProject"));
const EditProject = lazy(() => import("@/pages/EditProject/EditProject"));
const MapSkin = lazy(() => import("@/pages/MapSkin/MapSkin"));
const MapPreview = lazy(() => import("@/pages/MapPreview/MapPreview"));
const ViewProject = lazy(() => import("@/pages/ViewProject/ViewProject"));
const NotFound = lazy(() => import("@/pages/NotFound/NotFound"));

import ProtectedRoute from "@/router/ProtectedRoute";
import GuestRoute from "@/router/GuestRoute";
import RouteErrorBoundary from "@/components/common/RouteErrorBoundary";

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },

  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: (
          <GuestRoute>
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
              <Login />
            </Suspense>
          </GuestRoute>
        ),
      },
    ],
  },

  {
    element: <DashboardLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECT_CREATE,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <CreateProject />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECT_EDIT,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <EditProject />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECT_MAP_SKIN,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <MapSkin />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECT_VIEW,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <ViewProject />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECTS_MASTER,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <MasterProjects />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECTS_PORTFOLIO_DETAIL,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <PortfolioProjects />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECTS_INDIVIDUAL,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <Projects />
            </Suspense>
          </ProtectedRoute>
        ),
      },

      {
        path: ROUTES.PROJECTS,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-8">Loading page...</div>}>
              <Projects />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },

  {
    path: ROUTES.PROJECT_MAP_PREVIEW,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<div className="flex h-screen w-full bg-[#0a0a12] text-white items-center justify-center">Loading Map Preview...</div>}>
          <MapPreview />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "*",
    element: (
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default router;
