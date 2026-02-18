import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface TimeConfigPayload {
  start: string;
  end: string;
  weekdays: number[];
}

export interface CreateWiegandGroupPayload {
  group_id: string;
  sn: string;
  timestamp: number;
  del_flag: number;
  time_configs: TimeConfigPayload[];
}

export interface CreateUserWiegandPayload {
  sn: string;
  user_id: string;
  group_id: string;
  timestamp: number;
  del_flag: boolean;
}

export function useWiegandGroups(delFlag = 0) {
  return useQuery({
    queryKey: ["wiegandGroups", delFlag],
    queryFn: async () => {
      const res = await api.get(`/v1/api/wiegand_groups?del_flag=${delFlag}`);
      return res.data;
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useUserWiegands() {
  return useQuery({
    queryKey: ["userWiegands"],
    queryFn: async () => {
      const res = await api.get("/v1/api/user_wiegands");
      return res.data;
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useCreateUserWiegand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserWiegandPayload) => {
      const res = await api.post("/v1/api/user_wiegands", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWiegands"], exact: false });
    },
  });
}

export function useCreateWiegandGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateWiegandGroupPayload) => {
      const res = await api.post("/v1/api/wiegand_groups", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiegandGroups"], exact: false });
    },
  });
}

export function useUpdateWiegandGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateWiegandGroupPayload;
    }) => {
      const res = await api.put(`/v1/api/wiegand_groups/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wiegandGroups"], exact: false });
    },
  });
}
