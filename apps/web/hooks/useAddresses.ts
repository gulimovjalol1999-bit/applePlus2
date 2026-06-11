'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { AddressResponse, CreateAddressRequest } from '@/lib/api-types'

export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get<AddressResponse[]>('/addresses'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAddressRequest) => api.post<AddressResponse>('/addresses', dto),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['addresses'] }) },
  })
}
