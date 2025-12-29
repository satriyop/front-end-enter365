<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicCompanyProfile } from '@/api/useCompanyProfiles'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Users,
  Award,
  Calendar,
  Share2,
  Link2,
  ExternalLink,
  CheckCircle2,
  Building2,
  Instagram,
  Linkedin,
  Facebook,
  QrCode,
  Loader2
} from 'lucide-vue-next'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Fetch company profile
const { data: profile, isLoading, isError } = usePublicCompanyProfile(slug)

// Share modal state
const showShareModal = ref(false)
const showQRModal = ref(false)
const qrCodeUrl = ref<string>('')

// Dynamic theme CSS variables
const themeStyles = computed(() => {
  if (!profile.value) return {}
  return {
    '--primary-color': profile.value.primary_color || '#FF7A3D',
    '--secondary-color': profile.value.secondary_color || '#FF5100',
  }
})

// Generate QR Code for the profile URL
function generateQRCode() {
  if (!profile.value) return
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profile.value.public_url)}`
  qrCodeUrl.value = qrApiUrl
  showQRModal.value = true
}

// Share to WhatsApp (popular in Indonesia)
function shareToWhatsApp() {
  if (!profile.value) return
  const text = `Lihat profil ${profile.value.name}: ${profile.value.public_url}`
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

// Share to LinkedIn
function shareToLinkedIn() {
  if (!profile.value) return
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profile.value.public_url)}`
  window.open(url, '_blank')
}

// Get social icon component
function getSocialIcon(platform: string) {
  switch (platform) {
    case 'instagram': return Instagram
    case 'linkedin': return Linkedin
    case 'facebook': return Facebook
    default: return Globe
  }
}

// Get social display name
function getSocialName(platform: string) {
  switch (platform) {
    case 'instagram': return 'Instagram'
    case 'linkedin': return 'LinkedIn'
    case 'facebook': return 'Facebook'
    case 'youtube': return 'YouTube'
    default: return platform
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
    :style="themeStyles"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 text-[var(--primary-color)]" />
        <p class="text-slate-600 dark:text-slate-400">Memuat profil perusahaan...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="isError || !profile" class="min-h-screen flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <Building2 class="w-20 h-20 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          Profil Tidak Ditemukan
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mb-8">
          Maaf, profil perusahaan yang Anda cari tidak tersedia atau sudah tidak aktif.
        </p>
        <Button
          as="a"
          href="/"
          variant="outline"
          class="inline-flex"
        >
          <Globe class="w-4 h-4" />
          Kembali ke Beranda
        </Button>
      </div>
    </div>

    <!-- Profile Content -->
    <template v-else>
      <!-- Hero Section with Cover Image -->
      <section
        class="relative h-[40vh] md:h-[50vh] min-h-[320px] bg-gradient-to-br overflow-hidden"
        :style="profile.cover_image_url
          ? { backgroundImage: `url(${profile.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: `linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)` }
        "
      >
        <!-- Overlay for better text contrast -->
        <div
          class="absolute inset-0"
          :class="profile.cover_image_url ? 'bg-black/50' : 'bg-gradient-to-t from-black/30 to-transparent'"
        />

        <!-- Hero Content -->
        <div class="relative h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 md:pb-16">
          <div class="flex flex-col md:flex-row items-start md:items-end gap-6">
            <!-- Company Logo -->
            <div
              v-if="profile.logo_url"
              class="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 flex items-center justify-center border-4 border-white/20"
            >
              <img
                :src="profile.logo_url"
                :alt="`${profile.name} logo`"
                class="w-full h-full object-contain"
              />
            </div>

            <!-- Company Name & Tagline -->
            <div class="flex-1">
              <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {{ profile.name }}
              </h1>
              <p
                v-if="profile.tagline"
                class="text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md"
              >
                {{ profile.tagline }}
              </p>
            </div>

            <!-- Share Button (Desktop) -->
            <div class="hidden md:block">
              <Button
                variant="secondary"
                size="lg"
                class="bg-white/95 hover:bg-white text-slate-900 shadow-xl"
                @click="showShareModal = true"
              >
                <Share2 class="w-4 h-4" />
                Bagikan
              </Button>
            </div>
          </div>
        </div>

        <!-- Share Button (Mobile - Floating) -->
        <button
          class="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white"
          :style="{ background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))` }"
          @click="showShareModal = true"
        >
          <Share2 class="w-5 h-5" />
        </button>
      </section>

      <!-- Main Content -->
      <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-12 pb-16">
        <!-- Quick Info Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Card
            v-if="profile.founded_year"
            class="text-center bg-white dark:bg-slate-800"
            padding
          >
            <Calendar class="w-6 h-6 mx-auto mb-2 text-[var(--primary-color)]" />
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ profile.founded_year }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Berdiri</div>
          </Card>

          <Card
            v-if="profile.employees_count"
            class="text-center bg-white dark:bg-slate-800"
            padding
          >
            <Users class="w-6 h-6 mx-auto mb-2 text-[var(--primary-color)]" />
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ profile.employees_count }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Karyawan</div>
          </Card>

          <Card
            v-if="profile.services.length > 0"
            class="text-center bg-white dark:bg-slate-800"
            padding
          >
            <Briefcase class="w-6 h-6 mx-auto mb-2 text-[var(--primary-color)]" />
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ profile.services.length }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Layanan</div>
          </Card>

          <Card
            v-if="profile.certifications.length > 0"
            class="text-center bg-white dark:bg-slate-800"
            padding
          >
            <Award class="w-6 h-6 mx-auto mb-2 text-[var(--primary-color)]" />
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ profile.certifications.length }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Sertifikasi</div>
          </Card>
        </div>

        <!-- About Section -->
        <Card
          v-if="profile.description"
          class="mb-8 bg-white dark:bg-slate-800"
          padding
        >
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Building2 class="w-6 h-6 text-[var(--primary-color)]" />
            Tentang Kami
          </h2>
          <div class="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
            {{ profile.description }}
          </div>
        </Card>

        <!-- Services Section -->
        <section
          v-if="profile.services.length > 0"
          class="mb-8"
        >
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Briefcase class="w-6 h-6 text-[var(--primary-color)]" />
            Layanan Kami
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              v-for="(service, index) in profile.services"
              :key="index"
              class="bg-white dark:bg-slate-800 border-l-4 hover:shadow-lg transition-shadow"
              :style="{ borderLeftColor: 'var(--primary-color)' }"
              padding
              hoverable
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                  :style="{ background: `var(--primary-color)` }"
                >
                  <CheckCircle2 class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {{ service.title }}
                  </h3>
                  <p
                    v-if="service.description"
                    class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                  >
                    {{ service.description }}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <!-- Portfolio/Clients Section -->
        <section
          v-if="profile.portfolio.length > 0"
          class="mb-8"
        >
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Award class="w-6 h-6 text-[var(--primary-color)]" />
            Portfolio & Klien
          </h2>
          <div class="grid md:grid-cols-2 gap-6">
            <Card
              v-for="(item, index) in profile.portfolio"
              :key="index"
              class="bg-white dark:bg-slate-800"
              padding
              hoverable
            >
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-bold text-lg text-slate-900 dark:text-slate-100 flex-1">
                  {{ item.title }}
                </h3>
                <span
                  v-if="item.year"
                  class="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {{ item.year }}
                </span>
              </div>
              <p
                v-if="item.description"
                class="text-slate-600 dark:text-slate-400 leading-relaxed"
              >
                {{ item.description }}
              </p>
            </Card>
          </div>
        </section>

        <!-- Certifications Section -->
        <section
          v-if="profile.certifications.length > 0"
          class="mb-8"
        >
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Award class="w-6 h-6 text-[var(--primary-color)]" />
            Sertifikasi & Penghargaan
          </h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              v-for="(cert, index) in profile.certifications"
              :key="index"
              class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2"
              :style="{ borderColor: 'var(--primary-color)' }"
              padding
            >
              <div class="text-center">
                <div
                  class="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                  :style="{ background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))` }"
                >
                  <Award class="w-8 h-8 text-white" />
                </div>
                <h3 class="font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {{ cert.name }}
                </h3>
                <p
                  v-if="cert.issuer"
                  class="text-sm text-slate-600 dark:text-slate-400 mb-1"
                >
                  {{ cert.issuer }}
                </p>
                <p
                  v-if="cert.year"
                  class="text-xs text-slate-500 dark:text-slate-500"
                >
                  {{ cert.year }}
                </p>
              </div>
            </Card>
          </div>
        </section>

        <!-- Contact Section -->
        <Card class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <template #header>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Phone class="w-6 h-6 text-[var(--primary-color)]" />
              Hubungi Kami
            </h2>
          </template>

          <div class="grid md:grid-cols-2 gap-6">
            <!-- Contact Info -->
            <div class="space-y-4">
              <a
                v-if="profile.email"
                :href="`mailto:${profile.email}`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  :style="{ background: `var(--primary-color)` }"
                >
                  <Mail class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-600 dark:text-slate-400">Email</div>
                  <div class="font-medium text-slate-900 dark:text-slate-100 group-hover:text-[var(--primary-color)] truncate">
                    {{ profile.email }}
                  </div>
                </div>
                <ExternalLink class="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                v-if="profile.phone"
                :href="`tel:${profile.phone}`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  :style="{ background: `var(--primary-color)` }"
                >
                  <Phone class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-600 dark:text-slate-400">Telepon</div>
                  <div class="font-medium text-slate-900 dark:text-slate-100 group-hover:text-[var(--primary-color)]">
                    {{ profile.phone }}
                  </div>
                </div>
                <ExternalLink class="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a
                v-if="profile.website"
                :href="profile.website"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  :style="{ background: `var(--primary-color)` }"
                >
                  <Globe class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-600 dark:text-slate-400">Website</div>
                  <div class="font-medium text-slate-900 dark:text-slate-100 group-hover:text-[var(--primary-color)] truncate">
                    {{ profile.website }}
                  </div>
                </div>
                <ExternalLink class="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <div
                v-if="profile.address"
                class="flex items-start gap-3 p-3 rounded-lg"
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                  :style="{ background: `var(--primary-color)` }"
                >
                  <MapPin class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-600 dark:text-slate-400">Alamat</div>
                  <div class="font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    {{ profile.address }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Social Links & CTA -->
            <div class="flex flex-col justify-between">
              <!-- Social Links -->
              <div
                v-if="profile.social_links && Object.keys(profile.social_links).length > 0"
                class="mb-6"
              >
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Ikuti Kami
                </div>
                <div class="flex flex-wrap gap-2">
                  <a
                    v-for="[platform, url] in Object.entries(profile.social_links).filter(([, val]) => val)"
                    :key="platform"
                    :href="url as string"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all hover:scale-105"
                    :style="{
                      borderColor: 'var(--primary-color)',
                      color: 'var(--primary-color)'
                    }"
                    :title="`Kunjungi ${getSocialName(platform)}`"
                  >
                    <component :is="getSocialIcon(platform)" class="w-4 h-4" />
                    {{ getSocialName(platform) }}
                  </a>
                </div>
              </div>

              <!-- CTA Button -->
              <div
                class="p-6 rounded-xl text-center text-white"
                :style="{ background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))` }"
              >
                <h3 class="font-bold text-lg mb-2">Tertarik Bekerja Sama?</h3>
                <p class="text-white/90 text-sm mb-4">
                  Hubungi kami untuk diskusi lebih lanjut mengenai kebutuhan bisnis Anda
                </p>
                <Button
                  v-if="profile.email"
                  as="a"
                  :href="`mailto:${profile.email}?subject=Inquiry from ${profile.name} Profile`"
                  variant="secondary"
                  size="lg"
                  class="w-full bg-white hover:bg-slate-50 text-slate-900"
                >
                  <Mail class="w-4 h-4" />
                  Kirim Email
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>

      <!-- Footer -->
      <footer class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <p class="text-sm text-slate-600 dark:text-slate-400 text-center md:text-left">
              © {{ new Date().getFullYear() }} {{ profile.name }}. All rights reserved.
            </p>
            <a
              href="https://enter365.id"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-slate-500 hover:text-[var(--primary-color)] dark:text-slate-500 dark:hover:text-[var(--primary-color)] transition-colors inline-flex items-center gap-2"
            >
              Powered by
              <span class="font-semibold">Enter365</span>
            </a>
          </div>
        </div>
      </footer>

      <!-- Share Modal -->
      <Teleport to="body">
        <div
          v-if="showShareModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          @click.self="showShareModal = false"
        >
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100">Bagikan Profil</h3>
              <button
                class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                @click="showShareModal = false"
              >
                <span class="text-slate-400 text-xl">&times;</span>
              </button>
            </div>

            <div class="space-y-3">
              <!-- Copy URL -->
              <div class="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <Link2 class="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  :value="profile.public_url"
                  readonly
                  class="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none"
                />
                <CopyButton
                  :text="profile.public_url"
                  variant="icon"
                  size="sm"
                />
              </div>

              <!-- Share Buttons -->
              <div class="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  class="justify-center"
                  @click="shareToWhatsApp"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>

                <Button
                  variant="outline"
                  class="justify-center"
                  @click="shareToLinkedIn"
                >
                  <Linkedin class="w-5 h-5" />
                  LinkedIn
                </Button>

                <Button
                  variant="outline"
                  class="justify-center col-span-2"
                  @click="generateQRCode"
                >
                  <QrCode class="w-5 h-5" />
                  Tampilkan QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- QR Code Modal -->
      <Teleport to="body">
        <div
          v-if="showQRModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          @click.self="showQRModal = false"
        >
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              QR Code Profil
            </h3>
            <div class="bg-white p-4 rounded-xl inline-block mb-4">
              <img
                :src="qrCodeUrl"
                alt="QR Code"
                class="w-64 h-64"
              />
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Scan QR code ini untuk membuka profil perusahaan
            </p>
            <Button
              variant="outline"
              class="w-full"
              @click="showQRModal = false"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
/* CSS custom properties for dynamic theming */
:root {
  --primary-color: #ff7a3d;
  --secondary-color: #ff5100;
}

/* Smooth animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoom-in {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}

.animate-in {
  animation: fade-in 0.2s ease-out, zoom-in 0.2s ease-out;
}
</style>
