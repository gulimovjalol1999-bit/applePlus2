'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse, UserResponse } from '@/lib/api-types'

export interface UserFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () =>
      api.get<PaginatedResponse<UserResponse>>('/users', {
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
        search: filters.search,
        role: filters.role,
      }),
    staleTime: 30_000,
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch<UserResponse>(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<UserResponse>(`/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
