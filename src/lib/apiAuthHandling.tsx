import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export function useApiInterceptor() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status;

        if (status === 401 || status === 403) {
          enqueueSnackbar("Session expired. Please login again.", { variant: "error" });
          localStorage.removeItem("token");
          navigate("/login");
        } else if (error.response.data?.message) {
          enqueueSnackbar(error.response.data.message, { variant: "error" });
        } else {
          enqueueSnackbar("Something went wrong", { variant: "error" });
        }
      } else {
        enqueueSnackbar(error.message, { variant: "error" });
      }

      return Promise.reject(error);
    }
  );
}
