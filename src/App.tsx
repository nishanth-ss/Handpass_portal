import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { AuthProvider } from "./auth/AuthProvider";
import { useApiInterceptor } from "./lib/apiAuthHandling";
import { LayoutContainer } from "./components/Layout";
import { Sidebar } from "./components/Sidebar";
import { Suspense, lazy } from "react";
import { CommonLoader } from "./components/common/CommonLoader";

// MUI date localization
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export function ApiInterceptorProvider() {
  useApiInterceptor();
  return null;
}

// Lazy loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));
const Devices = lazy(() => import("./pages/Devices"));
const RemoteGroups = lazy(() => import("./pages/RemoteGroups"));
const TimeSchedules = lazy(() => import("./pages/TimeSchedules"));
const Reports = lazy(() => import("./pages/Reports"));
const GroupManagement = lazy(() => import("./pages/GroupManagement"));
const FirmwareCheck = lazy(() => import("./pages/FirmwareCheck"));
const LoginForm = lazy(() => import("./pages/Login"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ApiInterceptorProvider />

        {/* Wrap ALL components using date pickers */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>

          {/* Suspense for lazy-loaded routes */}
          <Suspense fallback={<CommonLoader />}>
            <Routes>

              {/* Public Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<LoginForm />} />
                <Route path="/login" element={<LoginForm />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<LayoutContainer sidebar={<Sidebar />} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/remote-groups" element={<RemoteGroups />} />
                  <Route path="/time-schedules" element={<TimeSchedules />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/group-management" element={<GroupManagement />} />
                  <Route path="/firm-check" element={<FirmwareCheck />} />
                </Route>
              </Route>

            </Routes>
          </Suspense>

        </LocalizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
