import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout
import Layout from "./components/layout/Layout";

// Authentication
import Login from "./pages/Login";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Flocks
import Flocks from "./pages/Flocks";
import FlockDetails from "./pages/FlockDetails";

// Production
import EggProduction from "./pages/EggProduction";
import EggInventory from "./pages/egg-inventory/EggInventory";

// Feed
import FeedManagement from "./pages/feed/FeedManagement";

// Health
import HealthManagement from "./pages/HealthManagement";
import Mortality from "./pages/Mortality";

// Sales & Customers
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";

// Finance
import Expenses from "./pages/Expenses";
import Suppliers from "./pages/Suppliers";

// Reports
import Reports from "./pages/Reports";

// User Management
import Users from "./pages/Users";
import Roles from "./pages/Roles";

// Settings
import Settings from "./pages/Settings";


/**
 * Protected Route
 *
 * Prevents unauthenticated users from accessing
 * the application pages.
 */
function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


/**
 * Application Routes
 */
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* =====================================================
          AUTHENTICATION
      ====================================================== */}

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />


      {/* =====================================================
          PROTECTED APPLICATION
      ====================================================== */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >

        {/* =================================================
            DASHBOARD
        ================================================== */}

        <Route
          index
          element={<Dashboard />}
        />


        {/* =================================================
            FLOCK MANAGEMENT
        ================================================== */}

        <Route
          path="flocks"
          element={<Flocks />}
        />

        <Route
          path="flocks/:id"
          element={<FlockDetails />}
        />


        {/* =================================================
            EGG MANAGEMENT
        ================================================== */}

        <Route
          path="egg-production"
          element={<EggProduction />}
        />

        <Route
          path="egg-inventory"
          element={<EggInventory />}
        />


        {/* =================================================
            FEED MANAGEMENT
        ================================================== */}

        <Route
          path="feed"
          element={<FeedManagement />}
        />


        {/* =================================================
            HEALTH MANAGEMENT
        ================================================== */}

        <Route
          path="health"
          element={<HealthManagement />}
        />

        <Route
          path="mortality"
          element={<Mortality />}
        />


        {/* =================================================
            SALES & CUSTOMERS
        ================================================== */}

        <Route
          path="sales"
          element={<Sales />}
        />

        <Route
          path="customers"
          element={<Customers />}
        />


        {/* =================================================
            FINANCE
        ================================================== */}

        <Route
          path="expenses"
          element={<Expenses />}
        />

        <Route
          path="suppliers"
          element={<Suppliers />}
        />


        {/* =================================================
            REPORTS
        ================================================== */}

        <Route
          path="reports"
          element={<Reports />}
        />


        {/* =================================================
            USER MANAGEMENT
        ================================================== */}

        <Route
          path="users"
          element={<Users />}
        />

        <Route
          path="roles"
          element={<Roles />}
        />


        {/* =================================================
            SETTINGS
        ================================================== */}

        <Route
          path="settings"
          element={<Settings />}
        />

      </Route>


      {/* =====================================================
          404 / UNKNOWN ROUTES
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={user ? "/" : "/login"}
            replace
          />
        }
      />

    </Routes>
  );
}


/**
 * Root Application
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}