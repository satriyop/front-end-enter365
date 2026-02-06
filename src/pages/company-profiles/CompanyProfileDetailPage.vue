<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCompanyProfile,
  useDeleteCompanyProfile,
  useRemoveLogo,
  useRemoveCover,
} from '@/api/useCompanyProfiles'
import { formatDate, formatDateTime } from '@/utils/format'
import { Button, Card, Badge, Modal, useToast } from '@/components/ui'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Building2,
  Users,
  Briefcase,
  Award,
  ImageOff,
} from 'lucide-vue-next'
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const profileId = computed(() => Number(route.params.id))
const { data: profile, isLoading, error } = useCompanyProfile(profileId)

// Mutations
const deleteMutation = useDeleteCompanyProfile()
const removeLogoMutation = useRemoveLogo()
const removeCoverMutation = useRemoveCover()

// Delete modal
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(profileId.value)
    toast.success('Company profile deleted')
    router.push('/company-profiles')
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to delete profile')
  } finally {
    showDeleteModal.value = false
  }
}

async function handleRemoveLogo() {
  try {
    await removeLogoMutation.mutateAsync(profileId.value)
    toast.success('Logo removed')
  } catch {
    toast.error('Failed to remove logo')
  }
}

async function handleRemoveCover() {
  try {
    await removeCoverMutation.mutateAsync(profileId.value)
    toast.success('Cover image removed')
  } catch {
    toast.error('Failed to remove cover image')
  }
}

async function copyPublicUrl() {
  if (!profile.value) return
  try {
    await navigator.clipboard.writeText(profile.value.public_url)
    toast.success('Public URL copied to clipboard')
  } catch {
    toast.error('Failed to copy URL')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="flex items-center justify-center gap-2 text-muted-foreground">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading profile...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-destructive">Failed to load company profile</p>
      <Button variant="ghost" class="mt-4" @click="router.push('/company-profiles')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Profiles
      </Button>
    </div>

    <template v-else-if="profile">
      <!-- Cover Banner -->
      <div
        class="h-32 sm:h-48 rounded-xl relative overflow-hidden mb-6"
        :style="{
          background: profile.cover_image_url
            ? `url(${profile.cover_image_url}) center/cover`
            : `linear-gradient(135deg, ${profile.primary_color} 0%, ${profile.secondary_color || profile.primary_color}88 100%)`,
        }"
      >
        <Button
          v-if="profile.cover_image_url"
          variant="ghost"
          size="xs"
          class="absolute top-3 right-3 bg-background/80 backdrop-blur"
          :loading="removeCoverMutation.isPending.value"
          @click="handleRemoveCover"
        >
          <ImageOff class="w-4 h-4 mr-1" />
          Remove Cover
        </Button>
      </div>

      <!-- Header with Logo -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 -mt-14 sm:-mt-16 px-4">
        <div class="flex items-end gap-4">
          <!-- Logo -->
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-card border-4 border-background shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              v-if="profile.logo_url"
              :src="profile.logo_url"
              :alt="profile.name"
              class="w-full h-full object-contain"
            />
            <span
              v-else
              class="text-3xl font-bold"
              :style="{ color: profile.primary_color }"
            >
              {{ profile.name.charAt(0) }}
            </span>
          </div>
          <div class="pb-1">
            <h1 class="text-2xl font-semibold text-foreground">{{ profile.name }}</h1>
            <p v-if="profile.tagline" class="text-muted-foreground">{{ profile.tagline }}</p>
            <div class="flex items-center gap-2 mt-1">
              <Badge :variant="profile.is_active ? 'success' : 'destructive'">
                {{ profile.is_active ? 'Active' : 'Inactive' }}
              </Badge>
              <span v-if="profile.slug" class="text-sm text-muted-foreground font-mono">
                /{{ profile.slug }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-4 sm:mt-8">
          <Button variant="ghost" @click="router.push('/company-profiles')">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="secondary" @click="router.push(`/company-profiles/${profile.id}/edit`)">
            <Pencil class="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" @click="showDeleteModal = true">
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- About -->
          <Card v-if="profile.description">
            <template #header>
              <div class="flex items-center gap-2">
                <Building2 class="w-4 h-4 text-muted-foreground" />
                <h2 class="font-medium text-foreground">About</h2>
              </div>
            </template>
            <p class="text-foreground whitespace-pre-line">{{ profile.description }}</p>
          </Card>

          <!-- Services -->
          <Card v-if="profile.services?.length">
            <template #header>
              <div class="flex items-center gap-2">
                <Briefcase class="w-4 h-4 text-muted-foreground" />
                <h2 class="font-medium text-foreground">Services</h2>
                <Badge variant="default">{{ profile.services.length }}</Badge>
              </div>
            </template>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="(service, idx) in profile.services"
                :key="idx"
                class="p-3 rounded-lg bg-muted/50"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span v-if="service.icon" class="text-lg">{{ service.icon }}</span>
                  <h3 class="font-medium text-foreground">{{ service.title }}</h3>
                </div>
                <p v-if="service.description" class="text-sm text-muted-foreground">
                  {{ service.description }}
                </p>
              </div>
            </div>
          </Card>

          <!-- Portfolio -->
          <Card v-if="profile.portfolio?.length">
            <template #header>
              <div class="flex items-center gap-2">
                <Award class="w-4 h-4 text-muted-foreground" />
                <h2 class="font-medium text-foreground">Portfolio</h2>
                <Badge variant="default">{{ profile.portfolio.length }}</Badge>
              </div>
            </template>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="(item, idx) in profile.portfolio"
                :key="idx"
                class="border border-border rounded-lg overflow-hidden"
              >
                <div
                  v-if="item.image_path"
                  class="h-32 bg-muted"
                  :style="{ background: `url(${item.image_path}) center/cover` }"
                />
                <div class="p-3">
                  <h3 class="font-medium text-foreground">{{ item.title }}</h3>
                  <p v-if="item.year" class="text-xs text-muted-foreground">{{ item.year }}</p>
                  <p v-if="item.description" class="text-sm text-muted-foreground mt-1">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <!-- Team -->
          <Card v-if="profile.team?.length">
            <template #header>
              <div class="flex items-center gap-2">
                <Users class="w-4 h-4 text-muted-foreground" />
                <h2 class="font-medium text-foreground">Team</h2>
                <Badge variant="default">{{ profile.team.length }}</Badge>
              </div>
            </template>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(member, idx) in profile.team"
                :key="idx"
                class="text-center p-3"
              >
                <div class="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center overflow-hidden mb-2">
                  <img
                    v-if="member.photo_path"
                    :src="member.photo_path"
                    :alt="member.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-lg font-semibold text-muted-foreground">
                    {{ member.name.charAt(0) }}
                  </span>
                </div>
                <h3 class="font-medium text-foreground text-sm">{{ member.name }}</h3>
                <p v-if="member.role" class="text-xs text-muted-foreground">{{ member.role }}</p>
              </div>
            </div>
          </Card>

          <!-- Certifications -->
          <Card v-if="profile.certifications?.length">
            <template #header>
              <div class="flex items-center gap-2">
                <Award class="w-4 h-4 text-muted-foreground" />
                <h2 class="font-medium text-foreground">Certifications</h2>
              </div>
            </template>
            <div class="space-y-3">
              <div
                v-for="(cert, idx) in profile.certifications"
                :key="idx"
                class="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/50"
              >
                <div>
                  <span class="font-medium text-foreground">{{ cert.name }}</span>
                  <span v-if="cert.issuer" class="text-sm text-muted-foreground ml-2">
                    by {{ cert.issuer }}
                  </span>
                  <span v-if="cert.year" class="text-sm text-muted-foreground ml-2">
                    ({{ cert.year }})
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Public URL -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Public URL</h2>
            </template>
            <div class="space-y-3">
              <code class="block px-3 py-2 bg-muted rounded text-sm text-muted-foreground break-all">
                {{ profile.public_url }}
              </code>
              <div class="flex gap-2">
                <Button variant="secondary" size="sm" class="flex-1" @click="copyPublicUrl">
                  <Copy class="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <a :href="profile.public_url" target="_blank" rel="noopener" class="flex-1">
                  <Button variant="secondary" size="sm" class="w-full">
                    <ExternalLink class="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          <!-- Contact Info -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Contact</h2>
            </template>
            <dl class="space-y-3 text-sm">
              <div v-if="profile.email" class="flex items-start gap-2">
                <Mail class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <dd class="text-foreground">{{ profile.email }}</dd>
              </div>
              <div v-if="profile.phone" class="flex items-start gap-2">
                <Phone class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <dd class="text-foreground">{{ profile.phone }}</dd>
              </div>
              <div v-if="profile.address" class="flex items-start gap-2">
                <MapPin class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <dd class="text-foreground">{{ profile.address }}</dd>
              </div>
              <div v-if="profile.website" class="flex items-start gap-2">
                <Globe class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <dd>
                  <a
                    :href="profile.website"
                    target="_blank"
                    rel="noopener"
                    class="text-primary hover:underline"
                  >
                    {{ profile.website }}
                  </a>
                </dd>
              </div>
              <p
                v-if="!profile.email && !profile.phone && !profile.address && !profile.website"
                class="text-muted-foreground"
              >
                No contact info set
              </p>
            </dl>
          </Card>

          <!-- Details -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Details</h2>
            </template>
            <dl class="space-y-3 text-sm">
              <div v-if="profile.founded_year" class="flex justify-between">
                <dt class="text-muted-foreground">Founded</dt>
                <dd class="text-foreground">{{ profile.founded_year }}</dd>
              </div>
              <div v-if="profile.employees_count" class="flex justify-between">
                <dt class="text-muted-foreground">Employees</dt>
                <dd class="text-foreground">{{ profile.employees_count }}</dd>
              </div>
              <div v-if="profile.custom_domain" class="flex justify-between">
                <dt class="text-muted-foreground">Custom Domain</dt>
                <dd class="text-foreground font-mono text-xs">{{ profile.custom_domain }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Created</dt>
                <dd class="text-foreground">{{ formatDate(profile.created_at) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Updated</dt>
                <dd class="text-foreground">{{ formatDateTime(profile.updated_at) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Branding -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Branding</h2>
            </template>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded border border-border"
                  :style="{ backgroundColor: profile.primary_color }"
                />
                <div>
                  <p class="text-sm text-foreground">Primary</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ profile.primary_color }}</p>
                </div>
              </div>
              <div v-if="profile.secondary_color" class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded border border-border"
                  :style="{ backgroundColor: profile.secondary_color }"
                />
                <div>
                  <p class="text-sm text-foreground">Secondary</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ profile.secondary_color }}</p>
                </div>
              </div>
              <div v-if="profile.logo_url" class="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive w-full"
                  :loading="removeLogoMutation.isPending.value"
                  @click="handleRemoveLogo"
                >
                  <ImageOff class="w-4 h-4 mr-1" />
                  Remove Logo
                </Button>
              </div>
            </div>
          </Card>

          <!-- Social Links -->
          <Card v-if="profile.social_links && Object.values(profile.social_links).some(Boolean)">
            <template #header>
              <h2 class="font-medium text-foreground">Social Links</h2>
            </template>
            <div class="space-y-2 text-sm">
              <a
                v-if="profile.social_links.instagram"
                :href="profile.social_links.instagram"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 text-foreground hover:text-primary"
              >
                Instagram
                <ExternalLink class="w-3 h-3" />
              </a>
              <a
                v-if="profile.social_links.linkedin"
                :href="profile.social_links.linkedin"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 text-foreground hover:text-primary"
              >
                LinkedIn
                <ExternalLink class="w-3 h-3" />
              </a>
              <a
                v-if="profile.social_links.facebook"
                :href="profile.social_links.facebook"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 text-foreground hover:text-primary"
              >
                Facebook
                <ExternalLink class="w-3 h-3" />
              </a>
              <a
                v-if="profile.social_links.youtube"
                :href="profile.social_links.youtube"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 text-foreground hover:text-primary"
              >
                YouTube
                <ExternalLink class="w-3 h-3" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Company Profile" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ profile?.name }}</strong>?
        This action cannot be undone.
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
