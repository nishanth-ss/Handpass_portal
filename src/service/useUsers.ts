import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { SingleUserWithGroupsResponse, UserRelatedResponse, UserResponse } from "../types/userTypes";

export function useUsers(page: number = 1, limit: number = 5,search?: string) {
 return useQuery<UserResponse>({
  queryKey: ["users", page, limit,search],
  queryFn: async () => {
    const searchParam = search ? `search=${search}` : ""
    const res = await api.get<UserResponse>(`/api/users?${searchParam}page=${page}&limit=${limit}`);
    return res.data;
  },
  staleTime: 1000 * 60,
  keepPreviousData: true,
  retry: false,
} as any);
}

export function useSingleUser(id: string | null | undefined) {
  return useQuery<SingleUserWithGroupsResponse>({
    queryKey: ["singleUser", id],
    queryFn: async () => {
      const res = await api.get<SingleUserWithGroupsResponse>(`/api/users/with-group/${id}`);
      return res.data;
    },
    enabled: !!id, // important: only fetch when id exists
    staleTime: 1000 * 60,
    retry: false,
  });
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { data } = await api.put(`/api/users/update-user/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });
};

// Delete User
export function useDeleteUser() {
  const queryClient = useQueryClient();

  // DO NOT type the return value
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },

    onError: (err: any) => {
      console.error("Delete failed:", err);
    },
  });
}


// `/api/group/members/${groupId}`
export function useFetchUserWithGroup({page = 1,limit = 10}) {
  return useQuery<UserRelatedResponse>({
    queryKey: ["getUserWithRelatedGroup",page,limit],
    queryFn: async () => {
      const res = await api.get<UserRelatedResponse>(`/api/users/with-group`);
      return res.data;
    },
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useDeleteGroupForThatUser() {
  const queryClient = useQueryClient();

  // DO NOT type the return value
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: any }) => {
      
      return api.delete(`/api/group/members/${groupId}?user_id=${userId}`)},

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getUserWithRelatedGroup"], exact: false });
    },

    onError: (err: any) => {
      console.error("Delete failed:", err);
    },
  });
}

// /api/users/with-group/
export function useDeleteUserWithGroup() {
  const queryClient = useQueryClient();

  // DO NOT type the return value
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/with-group/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getUserWithRelatedGroup"], exact: false });
    },

    onError: (err: any) => {
      console.error("Delete failed:", err);
    },
  });
}

interface CreateGroupPayload {
  group_name: string;
  description?: string;
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/api/group/add-group", payload);
      return res.data;
    },
    onSuccess: () => {
      // Refetch user list after creation
      queryClient.invalidateQueries({ queryKey: ["getUserWithRelatedGroup"] });
    }
  });
}