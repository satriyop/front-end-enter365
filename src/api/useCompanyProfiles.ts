import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import axios from 'axios'
import { api, type PaginatedResponse } from './client'

// ============================================
// Types
// ============================================

export interface ServiceItem {
  title: string
  description?: string
  icon?: string
}

export interface PortfolioItem {
  title: string
  description?: string
  image_path?: string
  year?: number
}

export interface TeamMember {
  name: string
  role?: string
  photo_path?: string
  bio?: string
}

export interface Certification {
  name: string
  issuer?: string
  year?: number
  image_path?: string
}

export interface SocialLinks {
  instagram?: string
  linkedin?: string
  facebook?: string
  youtube?: string
}

export interface CompanyProfile {
  id: number
  name: string
  slug: string
  tagline?: string
  description?: string
  founded_year?: number
  employees_count?: string

  // Branding
  logo_path?: string
  logo_url?: string
  cover_image_path?: string
  cover_image_url?: string
  primary_color: string
  secondary_color?: string

  // Content arrays
  services: ServiceItem[]
  portfolio: PortfolioItem[]
  team: TeamMember[]
  certifications: Certification[]
  social_links: SocialLinks

  // Contact
  email?: string
  phone?: string
  address?: string
  website?: string

  // Custom domain
  custom_domain?: string
  public_url: string

  // Status
  is_active: boolean

  // Timestamps
  created_at?: string
  updated_at?: string
}

export interface CompanyProfileFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateCompanyProfileData {
  name: string
  slug: string
  tagline?: string
  description?: string
  founded_year?: number
  employees_count?: string
  primary_color?: string
  secondary_color?: string
  services?: ServiceItem[]
  portfolio?: PortfolioItem[]
  team?: TeamMember[]
  certifications?: Certification[]
  social_links?: SocialLinks
  email?: string
  phone?: string
  address?: string
  website?: string
  custom_domain?: string
  is_active?: boolean
}

// ============================================
// Admin Query Hooks (Authenticated)
// ============================================

/**
 * Fetch paginated list of company profiles
 */
export function useCompanyProfiles(filters: Ref<CompanyProfileFilters>) {
  return useQuery({
    queryKey: computed(() => ['company-profiles', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<CompanyProfile>>('/company-profiles', {
        params: cleanParams,
      })
      return response.data
    },
  })
}

/**
 * Fetch single company profile by ID
 */
export function useCompanyProfile(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['company-profile', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: CompanyProfile }>(`/company-profiles/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

// ============================================
// Admin Mutation Hooks
// ============================================

/**
 * Create new company profile (supports FormData for file uploads)
 */
export function useCreateCompanyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCompanyProfileData | FormData) => {
      const isFormData = data instanceof FormData
      const response = await api.post<{ data: CompanyProfile }>('/company-profiles', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] })
    },
  })
}

/**
 * Update company profile (supports FormData for file uploads)
 */
export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: Partial<CreateCompanyProfileData> | FormData
    }) => {
      const isFormData = data instanceof FormData
      // Use POST with _method=PUT for FormData (Laravel convention)
      if (isFormData) {
        data.append('_method', 'PUT')
        const response = await api.post<{ data: CompanyProfile }>(`/company-profiles/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data.data
      }
      const response = await api.put<{ data: CompanyProfile }>(`/company-profiles/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] })
      queryClient.setQueryData(['company-profile', data.id], data)
    },
  })
}

/**
 * Delete company profile
 */
export function useDeleteCompanyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/company-profiles/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] })
      queryClient.removeQueries({ queryKey: ['company-profile', id] })
    },
  })
}

/**
 * Remove logo from company profile
 */
export function useRemoveLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<{ data: CompanyProfile }>(`/company-profiles/${id}/logo`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] })
      queryClient.setQueryData(['company-profile', data.id], data)
    },
  })
}

/**
 * Remove cover image from company profile
 */
export function useRemoveCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<{ data: CompanyProfile }>(`/company-profiles/${id}/cover`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] })
      queryClient.setQueryData(['company-profile', data.id], data)
    },
  })
}

// ============================================
// Public API (No Authentication)
// ============================================

const publicApi = axios.create({
  baseURL: '/api/v1/public/company-profiles',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export interface PublicCompanyProfileSummary {
  id: number
  name: string
  slug: string
  tagline?: string
  logo_url?: string
  primary_color: string
  public_url: string
}

/**
 * Fetch public company profile by slug or domain
 */
export function usePublicCompanyProfile(identifier: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['public-company-profile', identifier.value]),
    queryFn: async () => {
      const response = await publicApi.get<{ data: CompanyProfile }>(`/${identifier.value}`)
      return response.data.data
    },
    enabled: computed(() => !!identifier.value),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

/**
 * Fetch list of all public company profiles (for directory)
 */
export function usePublicCompanyProfiles() {
  return useQuery({
    queryKey: ['public-company-profiles'],
    queryFn: async () => {
      const response = await publicApi.get<{ data: PublicCompanyProfileSummary[] }>('/')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
