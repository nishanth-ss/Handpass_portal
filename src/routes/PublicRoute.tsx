// routes/PublicRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const PublicRoute = () => {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
