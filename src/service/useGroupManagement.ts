import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { GroupApiResponse } from "../types/groupManagement";

export function useGroupManagent(page = 1,limit=10) {
    return useQuery({
        queryKey: ["groupManagement", page,limit],
        queryFn: async (): Promise<GroupApiResponse> => {
            const res = await api.get(`/api/group?page=${page}&limit=${limit}`);
            return res.data;
        },
        staleTime: 1000 * 60,
        retry: false,
    });
}

export function useGroupViewMember(page = 1,limit=10, id: string) {
    return useQuery({
        queryKey: ["groupViewManagement", page,limit,id],
        queryFn: async (): Promise<GroupApiResponse> => {
            const res = await api.get(`/api/group/group-members/${id}?page=${page}&limit=${limit}`);
            return res.data;
        },
        staleTime: 1000 * 60,
        retry: false,
    });
}