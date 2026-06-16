'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CarrierLockStatus,
  PaginatedResponse,
  UsedPhoneConditionGrade,
  UsedPhoneDefect,
  UsedPhoneRepairRecord,
  UsedPhoneResponse,
  UsedPhoneWarrantyType,
} from '@/lib/api-types'

export interface UsedPhoneImageInput {
  url: string
  altText?: string
  sortOrder?: number
  isPrimary?: boolean
}

export interface UsedPhoneInput {
  name: string
  brandId: string
  categoryId: string
  description?: string
  images?: UsedPhoneImageInput[]

  sku: string
  price: number
  attributes?: Record<string, string>

  imei: string
  imei2?: string
  serialNumber?: string
  conditionGrade: UsedPhoneConditionGrade
  batteryHealthPercent: number
  defects?: UsedPhoneDefect[]
  repairHistory?: UsedPhoneRepairRecord[]
  includedAccessories?: string[]
  warrantyType?: UsedPhoneWarrantyType
  warrantyExpiresAt?: string
  carrierLockStatus?: CarrierLockStatus
  region?: string
  purchaseCostPrice: number
  gradeNotes?: string
}

export interface UsedPhoneFilterParams {
  [key: string]: string | number | boolean | undefined
  page?: number
  limit?: number
  search?: string
  brandId?: string
  categoryId?: string
  conditionGrade?: UsedPhoneConditionGrade
  carrierLockStatus?: CarrierLockStatus
  warrantyType?: UsedPhoneWarrantyType
  status?: string
  minPrice?: number
  maxPrice?: number
  minBattery?: number
  maxBattery?: number
  sortBy?: 'price' | 'createdAt' | 'batteryHealthPercent'
  sortOrder?: 'ASC' | 'DESC'
}

export interface MarkUsedPhoneSoldResponse {
  productId: string
  inventoryId: string
  sold: boolean
  soldAt: string
}

function invalidateUsedPhone(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ['admin-used-phone', id] })
  queryClient.invalidateQueries({ queryKey: ['used-phones'] })
}

export function useUsedPhones(filters: UsedPhoneFilterParams) {
  return useQuery({
    queryKey: ['used-phones', filters],
    queryFn: () => api.get<PaginatedResponse<UsedPhoneResponse>>('/used-phones', filters),
  })
}

export function useUsedPhone(id: string) {
  return useQuery({
    queryKey: ['admin-used-phone', id],
    queryFn: () => api.get<UsedPhoneResponse>(`/used-phones/${id}`),
    enabled: !!id,
  })
}

export function useCreateUsedPhone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UsedPhoneInput) => api.post<UsedPhoneResponse>('/used-phones', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['used-phones'] })
    },
  })
}

export function useUpdateUsedPhone(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<UsedPhoneInput>) =>
      api.patch<UsedPhoneResponse>(`/used-phones/${id}`, input),
    onSuccess: () => invalidateUsedPhone(queryClient, id),
  })
}

export function useDeleteUsedPhone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/used-phones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['used-phones'] })
    },
  })
}

export function useMarkUsedPhoneSold(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch<MarkUsedPhoneSoldResponse>(`/used-phones/${id}/mark-sold`, {}),
    onSuccess: () => invalidateUsedPhone(queryClient, id),
  })
}
