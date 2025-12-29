<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useCompanyProfiles,
  useDeleteCompanyProfile,
  type CompanyProfileFilters,
} from '@/api/useCompanyProfiles'
import { Button, Input, Modal, useToast, EmptyState } from '@/components/ui'

const toast = useToast()

// Filters state
const filters = ref<CompanyProfileFilters>({
  page: 1,
  per_page: 25,
  search: '',
})

// Fetch profiles
const { data, isLoading, error } = useCompanyProfiles(filters)

const profiles = computed(() => data.value?.data ?? [])

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

// Delete handling
const deleteMutation = useDeleteCompanyProfile()
const showDeleteModal = ref(false)
const profileToDelete = ref<number | null>(null)

function confirmDelete(id: number) {
  profileToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!profileToDelete.value) return

  try {
    await deleteMutation.mutateAsync(profileToDelete.value)
    showDeleteModal.value = false
    profileToDelete.value = null
    toast.success('Company profile deleted')
  } catch {
    toast.error('Failed to delete company profile')
  }
}

async function copyPublicUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Public URL copied to clipboard')
  } catch {
    toast.error('Failed to copy URL. Please copy manually.')
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Company Profiles</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage public company profiles</p>
      </div>
      <RouterLink to="/company-profiles/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Profile
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6"
    >
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by name, tagline..."
            @update:model-value="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <p class="text-red-500">Failed to load company profiles</p>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="isLoading"
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center"
    >
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="profiles.length === 0"
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
    >
      <EmptyState
        title="No company profiles found"
        description="Create your first company profile to share publicly"
        action-label="New Profile"
        @action="$router.push('/company-profiles/new')"
      />
    </div>

    <!-- Profile Cards Grid -->
    <div v-else class="grid gap-6 md:grid-cols-2">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <!-- Cover/Header -->
        <div
          class="h-24 relative"
          :style="{
            background: profile.cover_image_url
              ? `url(${profile.cover_image_url}) center/cover`
              : `linear-gradient(135deg, ${profile.primary_color} 0%, ${profile.secondary_color || profile.primary_color}88 100%)`,
          }"
        >
          <!-- Logo -->
          <div
            class="absolute -bottom-8 left-6 w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="profile.logo_url"
              :src="profile.logo_url"
              :alt="profile.name"
              class="w-full h-full object-contain"
            />
            <span v-else class="text-2xl font-bold" :style="{ color: profile.primary_color }">
              {{ profile.name.charAt(0) }}
            </span>
          </div>

          <!-- Status Badge -->
          <div class="absolute top-3 right-3">
            <span
              class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
              :class="
                profile.is_active
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              "
            >
              {{ profile.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="pt-12 p-6">
          <RouterLink
            :to="`/company-profiles/${profile.id}/edit`"
            class="text-lg font-semibold text-slate-900 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400"
          >
            {{ profile.name }}
          </RouterLink>
          <p v-if="profile.tagline" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ profile.tagline }}
          </p>

          <!-- Public URL -->
          <div class="mt-4 flex items-center gap-2">
            <code
              class="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm text-slate-600 dark:text-slate-400 truncate"
            >
              {{ profile.public_url }}
            </code>
            <Button variant="ghost" size="xs" @click="copyPublicUrl(profile.public_url)">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </Button>
            <a :href="profile.public_url" target="_blank" rel="noopener">
              <Button variant="ghost" size="xs">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </Button>
            </a>
          </div>

          <!-- Stats -->
          <div class="mt-4 flex gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span v-if="profile.services?.length">
              {{ profile.services.length }} services
            </span>
            <span v-if="profile.portfolio?.length">
              {{ profile.portfolio.length }} portfolio items
            </span>
            <span v-if="profile.founded_year"> Est. {{ profile.founded_year }} </span>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <RouterLink :to="`/company-profiles/${profile.id}/edit`" class="flex-1">
              <Button variant="outline" class="w-full">Edit Profile</Button>
            </RouterLink>
            <Button
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="confirmDelete(profile.id)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal
      :open="showDeleteModal"
      title="Delete Company Profile"
      size="sm"
      @update:open="showDeleteModal = $event"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this company profile? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
