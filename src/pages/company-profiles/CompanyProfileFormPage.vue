<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCompanyProfile,
  useCreateCompanyProfile,
  useUpdateCompanyProfile,
  useRemoveLogo,
  useRemoveCover,
  type CreateCompanyProfileData,
  type ServiceItem,
  type PortfolioItem,
  type Certification,
} from '@/api/useCompanyProfiles'
import { getErrorMessage } from '@/api/client'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Card,
  PageSkeleton,
  useToast,
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const profileId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => profileId.value !== null)
const pageTitle = computed(() => (isEditing.value ? 'Edit Company Profile' : 'New Company Profile'))

// Fetch existing profile if editing
const profileIdRef = computed(() => profileId.value ?? 0)
const { data: existingProfile, isLoading: loadingProfile } = useCompanyProfile(profileIdRef)

// Form state
const form = ref<CreateCompanyProfileData>({
  name: '',
  slug: '',
  tagline: '',
  description: '',
  founded_year: undefined,
  employees_count: '',
  primary_color: '#FF7A3D',
  secondary_color: '',
  services: [],
  portfolio: [],
  certifications: [],
  email: '',
  phone: '',
  address: '',
  website: '',
  custom_domain: '',
  is_active: true,
})

// File inputs
const logoFile = ref<File | null>(null)
const coverFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const coverPreview = ref<string | null>(null)

// Populate form when editing
watch(
  existingProfile,
  (profile) => {
    if (profile) {
      form.value = {
        name: profile.name,
        slug: profile.slug,
        tagline: profile.tagline || '',
        description: profile.description || '',
        founded_year: profile.founded_year,
        employees_count: profile.employees_count || '',
        primary_color: profile.primary_color,
        secondary_color: profile.secondary_color || '',
        services: profile.services || [],
        portfolio: profile.portfolio || [],
        certifications: profile.certifications || [],
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        website: profile.website || '',
        custom_domain: profile.custom_domain || '',
        is_active: profile.is_active,
      }
      logoPreview.value = profile.logo_url || null
      coverPreview.value = profile.cover_image_url || null
    }
  },
  { immediate: true }
)

// Auto-generate slug from name
watch(
  () => form.value.name,
  (name) => {
    if (!isEditing.value && name) {
      form.value.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }
  }
)

// File handling - revoke old blob URLs to prevent memory leaks
function handleLogoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (logoPreview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview.value)
    }
    logoFile.value = file
    logoPreview.value = URL.createObjectURL(file)
  }
}

function handleCoverChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (coverPreview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview.value)
    }
    coverFile.value = file
    coverPreview.value = URL.createObjectURL(file)
  }
}

// Cleanup blob URLs on component unmount
onUnmounted(() => {
  if (logoPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(logoPreview.value)
  }
  if (coverPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(coverPreview.value)
  }
})

// Remove logo/cover
const removeLogo = useRemoveLogo()
const removeCover = useRemoveCover()

async function handleRemoveLogo() {
  if (isEditing.value && profileId.value) {
    try {
      await removeLogo.mutateAsync(profileId.value)
      logoPreview.value = null
      toast.success('Logo removed')
    } catch {
      toast.error('Failed to remove logo')
    }
  } else {
    logoFile.value = null
    logoPreview.value = null
  }
}

async function handleRemoveCover() {
  if (isEditing.value && profileId.value) {
    try {
      await removeCover.mutateAsync(profileId.value)
      coverPreview.value = null
      toast.success('Cover removed')
    } catch {
      toast.error('Failed to remove cover')
    }
  } else {
    coverFile.value = null
    coverPreview.value = null
  }
}

// Services management
function addService() {
  form.value.services = [...(form.value.services || []), { title: '', description: '', icon: '' }]
}

function removeService(index: number) {
  form.value.services = form.value.services?.filter((_, i) => i !== index)
}

// Portfolio management
function addPortfolio() {
  form.value.portfolio = [...(form.value.portfolio || []), { title: '', description: '' }]
}

function removePortfolio(index: number) {
  form.value.portfolio = form.value.portfolio?.filter((_, i) => i !== index)
}

// Certifications management
function addCertification() {
  form.value.certifications = [
    ...(form.value.certifications || []),
    { name: '', issuer: '', year: undefined },
  ]
}

function removeCertification(index: number) {
  form.value.certifications = form.value.certifications?.filter((_, i) => i !== index)
}

// Form submission
const createMutation = useCreateCompanyProfile()
const updateMutation = useUpdateCompanyProfile()

const isSubmitting = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value
)

async function onSubmit() {
  // Build FormData if we have files
  const hasFiles = logoFile.value || coverFile.value
  let payload: CreateCompanyProfileData | FormData

  if (hasFiles) {
    const formData = new FormData()

    // Add all form fields
    Object.entries(form.value).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0')
        } else {
          formData.append(key, String(value))
        }
      }
    })

    // Add files
    if (logoFile.value) {
      formData.append('logo', logoFile.value)
    }
    if (coverFile.value) {
      formData.append('cover_image', coverFile.value)
    }

    payload = formData
  } else {
    payload = { ...form.value }
  }

  try {
    if (isEditing.value && profileId.value) {
      await updateMutation.mutateAsync({ id: profileId.value, data: payload })
      toast.success('Company profile updated')
      router.push('/company-profiles')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Company profile created')
      router.push('/company-profiles')
    }
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to save company profile'))
  }
}

// Keyboard shortcut: Ctrl+S to save
useFormShortcuts({
  onSave: onSubmit,
  onCancel: () => router.back(),
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update your company profile' : 'Create a new company profile' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd
          class="hidden sm:inline-flex px-2 py-1 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600"
        >
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">Cancel</Button>
      </div>
    </div>

    <!-- Loading state -->
    <PageSkeleton v-if="isEditing && loadingProfile" type="form" />

    <!-- Form -->
    <form v-else class="space-y-6" @submit.prevent="onSubmit">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Basic Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Company Name" required class="md:col-span-2">
            <Input v-model="form.name" placeholder="PT Example Company" />
          </FormField>

          <FormField label="URL Slug" required>
            <Input v-model="form.slug" placeholder="example-company" />
            <p class="text-xs text-slate-500 mt-1">Used in the public URL: /profile/{{ form.slug || 'slug' }}</p>
          </FormField>

          <FormField label="Custom Domain">
            <Input v-model="form.custom_domain" placeholder="example.com" />
          </FormField>

          <FormField label="Tagline" class="md:col-span-2">
            <Input v-model="form.tagline" placeholder="Your company tagline" />
          </FormField>

          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="form.description" :rows="4" placeholder="About your company..." />
          </FormField>

          <FormField label="Founded Year">
            <Input v-model.number="form.founded_year" type="number" placeholder="2015" />
          </FormField>

          <FormField label="Employees Count">
            <Input v-model="form.employees_count" placeholder="50-100" />
          </FormField>
        </div>
      </Card>

      <!-- Branding -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Branding</h2>
        </template>

        <div class="space-y-6">
          <!-- Colors -->
          <div class="grid grid-cols-2 gap-4">
            <FormField label="Primary Color">
              <div class="flex items-center gap-2">
                <input
                  v-model="form.primary_color"
                  type="color"
                  class="w-12 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <Input v-model="form.primary_color" placeholder="#FF7A3D" class="flex-1" />
              </div>
            </FormField>

            <FormField label="Secondary Color">
              <div class="flex items-center gap-2">
                <input
                  v-model="form.secondary_color"
                  type="color"
                  class="w-12 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <Input v-model="form.secondary_color" placeholder="#FF5100" class="flex-1" />
              </div>
            </FormField>
          </div>

          <!-- Logo -->
          <FormField label="Logo">
            <div class="flex items-center gap-4">
              <div
                v-if="logoPreview"
                class="w-20 h-20 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-800"
              >
                <img :src="logoPreview" alt="Logo" class="w-full h-full object-contain" />
              </div>
              <div class="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  class="text-sm text-slate-500"
                  @change="handleLogoChange"
                />
                <Button
                  v-if="logoPreview"
                  type="button"
                  variant="ghost"
                  size="xs"
                  class="text-red-500"
                  @click="handleRemoveLogo"
                >
                  Remove Logo
                </Button>
              </div>
            </div>
          </FormField>

          <!-- Cover Image -->
          <FormField label="Cover Image">
            <div class="space-y-2">
              <div
                v-if="coverPreview"
                class="w-full h-32 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden"
              >
                <img :src="coverPreview" alt="Cover" class="w-full h-full object-cover" />
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  class="text-sm text-slate-500"
                  @change="handleCoverChange"
                />
                <Button
                  v-if="coverPreview"
                  type="button"
                  variant="ghost"
                  size="xs"
                  class="text-red-500"
                  @click="handleRemoveCover"
                >
                  Remove Cover
                </Button>
              </div>
            </div>
          </FormField>
        </div>
      </Card>

      <!-- Services -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Services</h2>
            <Button type="button" variant="ghost" size="xs" @click="addService">
              + Add Service
            </Button>
          </div>
        </template>

        <div v-if="form.services?.length" class="space-y-4">
          <div
            v-for="(service, index) in form.services"
            :key="index"
            class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
          >
            <div class="flex items-start gap-4">
              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Title" required>
                  <Input v-model="(service as ServiceItem).title" placeholder="Service name" />
                </FormField>
                <FormField label="Icon">
                  <Input v-model="(service as ServiceItem).icon" placeholder="zap, sun, etc." />
                </FormField>
                <FormField label="Description" class="md:col-span-2">
                  <Textarea
                    v-model="(service as ServiceItem).description"
                    :rows="2"
                    placeholder="Service description"
                  />
                </FormField>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                class="text-red-500"
                @click="removeService(index)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 dark:text-slate-400">
          No services added yet. Click "Add Service" to add one.
        </p>
      </Card>

      <!-- Portfolio -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Portfolio</h2>
            <Button type="button" variant="ghost" size="xs" @click="addPortfolio">
              + Add Project
            </Button>
          </div>
        </template>

        <div v-if="form.portfolio?.length" class="space-y-4">
          <div
            v-for="(project, index) in form.portfolio"
            :key="index"
            class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
          >
            <div class="flex items-start gap-4">
              <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Project Title" required>
                  <Input v-model="(project as PortfolioItem).title" placeholder="Project name" />
                </FormField>
                <FormField label="Year">
                  <Input
                    v-model.number="(project as PortfolioItem).year"
                    type="number"
                    placeholder="2024"
                  />
                </FormField>
                <FormField label="Description" class="md:col-span-2">
                  <Textarea
                    v-model="(project as PortfolioItem).description"
                    :rows="2"
                    placeholder="Project description"
                  />
                </FormField>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                class="text-red-500"
                @click="removePortfolio(index)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 dark:text-slate-400">
          No portfolio items added yet.
        </p>
      </Card>

      <!-- Certifications -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Certifications</h2>
            <Button type="button" variant="ghost" size="xs" @click="addCertification">
              + Add Certification
            </Button>
          </div>
        </template>

        <div v-if="form.certifications?.length" class="space-y-4">
          <div
            v-for="(cert, index) in form.certifications"
            :key="index"
            class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
          >
            <div class="flex items-start gap-4">
              <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Name" required>
                  <Input v-model="(cert as Certification).name" placeholder="ISO 9001:2015" />
                </FormField>
                <FormField label="Issuer">
                  <Input v-model="(cert as Certification).issuer" placeholder="Certifying body" />
                </FormField>
                <FormField label="Year">
                  <Input v-model.number="(cert as Certification).year" type="number" placeholder="2020" />
                </FormField>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                class="text-red-500"
                @click="removeCertification(index)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 dark:text-slate-400">
          No certifications added yet.
        </p>
      </Card>

      <!-- Contact Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Contact Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Email">
            <Input v-model="form.email" type="email" placeholder="info@company.com" />
          </FormField>

          <FormField label="Phone">
            <Input v-model="form.phone" placeholder="+62 21 1234567" />
          </FormField>

          <FormField label="Website">
            <Input v-model="form.website" placeholder="https://company.com" />
          </FormField>

          <FormField label="Address" class="md:col-span-2">
            <Textarea v-model="form.address" :rows="2" placeholder="Company address" />
          </FormField>
        </div>
      </Card>

      <!-- Status -->
      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-slate-900 dark:text-slate-100">Active Status</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Inactive profiles won't be visible publicly
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-300 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"
            />
          </label>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Profile' : 'Create Profile' }}
        </Button>
      </div>
    </form>
  </div>
</template>
