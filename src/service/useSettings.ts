import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AttendanceResponse } from "../types/settingTypes";

export function useAttenence(page: number = 1, limit: number = 5) {
 return useQuery<AttendanceResponse>({
  queryKey: ["attenence", page, limit],
  queryFn: async () => {
    // const searchParam = search ? `search=${search}` : ""
    const res = await api.get<AttendanceResponse>(`/api/attendance-settings?page=${page}&limit=${limit}`);
    return res.data;
  },
  staleTime: 1000 * 60,
  keepPreviousData: true,
  retry: false,
} as any);
}

export const createAttendance = ()=>{
     const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/api/attendance-settings`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attenence"], exact: false });
    },
  });
}