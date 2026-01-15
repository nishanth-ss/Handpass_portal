import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider"

const ProtectedRoute = () => {
    const {token} = useAuth();
  return (
    token ? <Outlet /> : <Navigate to={"/login"} replace /> 
  )
}

export default ProtectedRoute