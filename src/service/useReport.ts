import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ReportPayload, ReportResponse } from "../types/reportTypes";

export function useReportsMutation() {
  return useMutation<ReportResponse, Error, ReportPayload>({
    mutationFn: async (payload: ReportPayload) => {
      const res = await api.post<ReportResponse>(
        `/api/report/access-list`,
        payload
      );
      return res.data;
    },
     retry: false,
  });
}


export function useReportsPolling(payload?: ReportPayload) {
  return useQuery<ReportResponse>({
    queryKey: ["reports-poll", payload],
    queryFn: async () => {
      const res = await api.post<ReportResponse>(
        `/api/report/access-list`,
        payload ?? {}
      );
      return res.data;
    },
    refetchInterval: 60000,  // 🔁 every 5 seconds
    refetchOnWindowFocus: false,
  });
}



