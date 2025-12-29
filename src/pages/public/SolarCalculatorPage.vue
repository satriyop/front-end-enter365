<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { usePublicSolarCalculator } from '@/api/usePublicSolarCalculator'
import { formatCurrency, formatNumber } from '@/utils/format'
import {
  Sun,
  Zap,
  Leaf,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TreePine,
  TrendingDown,
  Clock,
  ArrowRight,
  Check,
  X,
} from 'lucide-vue-next'

const {
  loading,
  error,
  result,
  tariffs,
  calculate,
  fetchTariffs,
} = usePublicSolarCalculator()

// Form state - Default to corporate level
const monthlyBill = ref<number>(50000000)
const selectedPower = ref<number>(53000)
const targetSavings = ref<number>(0)

// UI state
const showTechnicalDetails = ref(false)
const showLeadForm = ref(false)
const leadSubmitting = ref(false)
const leadSuccess = ref(false)
const showResults = ref(false)

// Lead form
const leadForm = ref({
  name: '',
  email: '',
  phone: '',
})

// Power options for B2B/Corporate customers (kVA scale)
const powerOptions = [
  { va: 16500, label: '16.5 kVA', description: 'Kantor kecil', icon: '🏢' },
  { va: 33000, label: '33 kVA', description: 'Gedung menengah', icon: '🏬' },
  { va: 53000, label: '53 kVA', description: 'Gedung perkantoran', icon: '🏛️', popular: true },
  { va: 105000, label: '105 kVA', description: 'Pabrik kecil', icon: '🏭' },
  { va: 200000, label: '200 kVA', description: 'Industri menengah', icon: '⚡' },
  { va: 500000, label: '500+ kVA', description: 'Industri besar', icon: '🔋' },
]

// Get selected tariff based on power (business/industrial)
const selectedTariff = computed(() => {
  // Prioritize business and industrial tariffs for B2B customers
  const businessTariffs = tariffs.value.filter((t) =>
    t.customer_type === 'business' || t.customer_type === 'industrial'
  )

  // Find matching tariff by power
  const matchingTariff = businessTariffs.find((t) =>
    selectedPower.value >= t.power_va_min &&
    (t.power_va_max === null || selectedPower.value <= t.power_va_max)
  )

  // Fallback to any tariff that matches power, or default business tariff
  if (matchingTariff) return matchingTariff

  // If no business tariff matches, use the closest one or B-2/TR
  return businessTariffs.find((t) => t.category_code?.startsWith('B-2')) ||
    businessTariffs[0] ||
    tariffs.value.find((t) => t.category_code?.startsWith('B-'))
})

// Max savings is the monthly bill
const maxSavings = computed(() => monthlyBill.value)

// Slider percentage for visual feedback
const savingsPercent = computed(() => {
  if (maxSavings.value <= 0) return 0
  return Math.round((targetSavings.value / maxSavings.value) * 100)
})

// Sun scale based on savings percentage
const sunScale = computed(() => {
  return 0.6 + (savingsPercent.value / 100) * 0.6
})

// When monthly bill changes, adjust target savings
watch(monthlyBill, (newBill) => {
  targetSavings.value = Math.round(newBill * 0.8)
})

// Format bill input with thousand separators
const formattedBill = computed({
  get: () => formatNumber(monthlyBill.value),
  set: (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10)
    monthlyBill.value = isNaN(num) ? 0 : num
  }
})

// Corporate bill minimum Rp 5 juta
const canCalculate = computed(() => monthlyBill.value >= 5000000)

// Calculate handler
async function handleCalculate() {
  if (!canCalculate.value) return

  showResults.value = false

  await calculate({
    monthly_bill: monthlyBill.value,
    pln_category: selectedTariff.value?.category_code,
    target_savings: targetSavings.value,
  })

  await nextTick()
  showResults.value = true

  // Scroll to results
  setTimeout(() => {
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}

// Lead form submit
async function handleLeadSubmit() {
  if (!leadForm.value.email && !leadForm.value.phone) {
    return
  }

  leadSubmitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  leadSubmitting.value = false
  leadSuccess.value = true
  showLeadForm.value = false
}

// Format helpers
function formatRupiah(value: number): string {
  if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(1)} Miliar`
  }
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(0)} Juta`
  }
  return formatCurrency(value)
}

function formatKwh(value: number): string {
  return `${formatNumber(value)} kWh`
}

// Initialize
onMounted(async () => {
  await fetchTariffs()
  targetSavings.value = Math.round(monthlyBill.value * 0.8)
})
</script>

<template>
  <div class="solar-calculator">
    <!-- Animated Background -->
    <div class="bg-pattern"></div>

    <!-- Floating Elements -->
    <div class="floating-elements">
      <div class="sun-glow"></div>
    </div>

    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">
            <Sun class="w-6 h-6" />
          </div>
          <div class="logo-text">
            <span class="logo-title">Solar Calculator</span>
            <span class="logo-subtitle">by Enter365</span>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Hero -->
      <div class="hero">
        <div class="hero-badge">
          <Sparkles class="w-4 h-4" />
          <span>Solusi Solar untuk Perusahaan</span>
        </div>
        <h1 class="hero-title">
          Hitung Potensi<br />
          <span class="highlight">Hemat Biaya Listrik</span> Perusahaan
        </h1>
        <p class="hero-subtitle">
          Simulasi cepat untuk BUMN, korporasi, dan industri. Lihat berapa yang bisa dihemat dengan PLTS.
        </p>
      </div>

      <!-- Calculator Card -->
      <div class="calculator-card">
        <!-- Step 1: Monthly Bill -->
        <div class="form-section">
          <div class="section-header">
            <div class="step-badge">1</div>
            <div class="section-title">Tagihan Listrik Bulanan</div>
          </div>

          <div class="bill-input-wrapper">
            <span class="currency-prefix">Rp</span>
            <input
              v-model="formattedBill"
              type="text"
              inputmode="numeric"
              class="bill-input"
              placeholder="50.000.000"
            />
          </div>
          <p class="input-hint">Masukkan rata-rata tagihan PLN perusahaan per bulan</p>
        </div>

        <!-- Step 2: Power Selection -->
        <div class="form-section">
          <div class="section-header">
            <div class="step-badge">2</div>
            <div class="section-title">Kapasitas Daya Terpasang</div>
          </div>

          <div class="power-grid">
            <button
              v-for="option in powerOptions"
              :key="option.va"
              class="power-card"
              :class="{
                'selected': selectedPower === option.va,
                'popular': option.popular
              }"
              @click="selectedPower = option.va"
            >
              <span v-if="option.popular" class="popular-badge">Populer</span>
              <span class="power-icon">{{ option.icon }}</span>
              <span class="power-label">{{ option.label }}</span>
              <span class="power-desc">{{ option.description }}</span>
              <div v-if="selectedPower === option.va" class="check-mark">
                <Check class="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        <!-- Step 3: Savings Slider -->
        <div class="form-section savings-section">
          <div class="section-header">
            <div class="step-badge">3</div>
            <div class="section-title">Target Hemat</div>
          </div>

          <div class="savings-display">
            <!-- Animated Sun -->
            <div class="sun-animation" :style="{ transform: `scale(${sunScale})` }">
              <div class="sun-core">
                <Sun class="sun-icon" />
              </div>
              <div class="sun-rays"></div>
            </div>

            <div class="savings-amount">
              {{ formatCurrency(targetSavings) }}
            </div>
            <div class="savings-percent">
              {{ savingsPercent }}% dari tagihan
            </div>
          </div>

          <div class="slider-container">
            <input
              v-model.number="targetSavings"
              type="range"
              :min="0"
              :max="maxSavings"
              :step="1000000"
              class="savings-slider"
            />
            <div class="slider-track">
              <div class="slider-fill" :style="{ width: savingsPercent + '%' }"></div>
            </div>
            <div class="slider-labels">
              <span>Rp 0</span>
              <span>{{ formatCurrency(maxSavings) }}</span>
            </div>
          </div>
        </div>

        <!-- Calculate Button -->
        <button
          class="calculate-btn"
          :class="{ 'loading': loading }"
          :disabled="!canCalculate || loading"
          @click="handleCalculate"
        >
          <span v-if="!loading" class="btn-content">
            <Sparkles class="w-5 h-5" />
            <span>Hitung Sekarang</span>
            <ArrowRight class="w-5 h-5 arrow" />
          </span>
          <span v-else class="btn-loading">
            <div class="spinner"></div>
            <span>Menghitung...</span>
          </span>
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </div>

      <!-- Results Section -->
      <div v-if="result" id="results" class="results-section" :class="{ 'show': showResults }">
        <!-- Celebration Header -->
        <div class="results-header">
          <div class="celebration-icon">
            <Sun class="w-12 h-12" />
          </div>
          <h2 class="results-title">Selamat! 🎉</h2>
          <p class="results-subtitle">Anda bisa hemat hingga</p>
          <div class="big-savings">
            {{ formatCurrency(result.savings.monthly_savings) }}
            <span class="per-month">/bulan</span>
          </div>
        </div>

        <!-- Key Stats -->
        <div class="stats-grid">
          <div class="stat-card green">
            <div class="stat-icon">
              <TrendingDown class="w-6 h-6" />
            </div>
            <div class="stat-value">{{ result.savings.solar_offset_percent }}%</div>
            <div class="stat-label">Hemat Tagihan</div>
          </div>

          <div class="stat-card blue">
            <div class="stat-icon">
              <Zap class="w-6 h-6" />
            </div>
            <div class="stat-value">{{ result.recommendation.capacity_kwp }} kWp</div>
            <div class="stat-label">Kapasitas Sistem</div>
          </div>

          <div class="stat-card amber">
            <div class="stat-icon">
              <Clock class="w-6 h-6" />
            </div>
            <div class="stat-value">{{ result.financial.payback_years?.toFixed(1) || '-' }} Thn</div>
            <div class="stat-label">Balik Modal</div>
          </div>
        </div>

        <!-- Bill Comparison -->
        <div class="comparison-card">
          <div class="comparison-title">Perbandingan Tagihan Bulanan</div>
          <div class="comparison-visual">
            <div class="bill-bar before">
              <div class="bar-label">Sebelum</div>
              <div class="bar-fill" style="width: 100%"></div>
              <div class="bar-value">{{ formatCurrency(result.savings.monthly_bill_before) }}</div>
            </div>
            <div class="bill-bar after">
              <div class="bar-label">Sesudah</div>
              <div class="bar-fill" :style="{ width: (100 - result.savings.solar_offset_percent) + '%' }"></div>
              <div class="bar-value">{{ formatCurrency(result.savings.monthly_bill_after) }}</div>
            </div>
          </div>
        </div>

        <!-- Lifetime Savings Banner -->
        <div class="lifetime-banner">
          <div class="lifetime-content">
            <div class="lifetime-label">Total Hemat 25 Tahun</div>
            <div class="lifetime-value">{{ formatRupiah(result.financial.lifetime_savings) }}</div>
          </div>
          <div class="banner-decoration">
            <Sun class="w-20 h-20 opacity-20" />
          </div>
        </div>

        <!-- Investment Info -->
        <div class="investment-card">
          <div class="investment-header">
            <span class="investment-label">Estimasi Investasi</span>
            <span class="investment-value">{{ formatRupiah(result.financial.investment_cost) }}</span>
          </div>
          <div class="investment-details">
            <div class="detail-item">
              <span>~{{ result.recommendation.estimated_panels }} panel surya</span>
            </div>
            <div class="detail-item">
              <span>~{{ result.recommendation.roof_area_m2 }} m² atap</span>
            </div>
            <div class="detail-item">
              <span>ROI {{ result.financial.roi_percent }}%</span>
            </div>
          </div>
        </div>

        <!-- Environmental Impact -->
        <div class="eco-card">
          <div class="eco-header">
            <Leaf class="w-5 h-5" />
            <span>Dampak Lingkungan</span>
          </div>
          <div class="eco-stats">
            <div class="eco-stat">
              <div class="eco-value">{{ result.environmental.co2_offset_tons_per_year.toFixed(1) }}</div>
              <div class="eco-label">Ton CO₂/tahun</div>
            </div>
            <div class="eco-stat">
              <div class="eco-value">
                <TreePine class="inline w-5 h-5 mr-1" />
                {{ result.environmental.trees_equivalent }}
              </div>
              <div class="eco-label">Setara pohon</div>
            </div>
          </div>
        </div>

        <!-- Technical Details -->
        <div class="details-accordion">
          <button class="accordion-header" @click="showTechnicalDetails = !showTechnicalDetails">
            <span>Detail Teknis</span>
            <component :is="showTechnicalDetails ? ChevronUp : ChevronDown" class="w-5 h-5" />
          </button>
          <div v-if="showTechnicalDetails" class="accordion-content">
            <div class="details-grid">
              <div class="detail-group">
                <div class="detail-title">Produksi Energi</div>
                <div class="detail-row">
                  <span>Per Bulan</span>
                  <span>{{ formatKwh(result.production.monthly_kwh) }}</span>
                </div>
                <div class="detail-row">
                  <span>Per Tahun</span>
                  <span>{{ formatKwh(result.production.annual_kwh) }}</span>
                </div>
              </div>
              <div class="detail-group">
                <div class="detail-title">Tarif PLN</div>
                <div class="detail-row">
                  <span>Kategori</span>
                  <span>{{ result.input.pln_tariff.code }}</span>
                </div>
                <div class="detail-row">
                  <span>Tarif</span>
                  <span>Rp {{ formatNumber(result.input.pln_tariff.rate_per_kwh) }}/kWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="cta-section">
          <div v-if="!showLeadForm && !leadSuccess" class="cta-content">
            <h3 class="cta-title">Tertarik dengan Solusi PLTS untuk Perusahaan?</h3>
            <p class="cta-subtitle">Dapatkan konsultasi GRATIS dan proposal untuk perusahaan Anda</p>
            <button class="cta-btn" @click="showLeadForm = true">
              <span>Minta Proposal</span>
              <ArrowRight class="w-5 h-5" />
            </button>
          </div>

          <div v-else-if="showLeadForm" class="lead-form">
            <button class="close-form" @click="showLeadForm = false">
              <X class="w-5 h-5" />
            </button>
            <h3 class="form-title">Data Kontak Perusahaan</h3>
            <div class="form-fields">
              <input
                v-model="leadForm.name"
                type="text"
                placeholder="Nama & Jabatan"
                class="form-input"
              />
              <input
                v-model="leadForm.phone"
                type="tel"
                placeholder="Nomor WhatsApp"
                class="form-input"
              />
              <input
                v-model="leadForm.email"
                type="email"
                placeholder="Email perusahaan"
                class="form-input"
              />
            </div>
            <button
              class="submit-btn"
              :disabled="leadSubmitting || (!leadForm.phone && !leadForm.email)"
              @click="handleLeadSubmit"
            >
              <span v-if="!leadSubmitting">Kirim Permintaan</span>
              <span v-else>Mengirim...</span>
            </button>
          </div>

          <div v-else class="success-message">
            <div class="success-icon">✓</div>
            <h3>Terima kasih!</h3>
            <p>Tim sales kami akan menghubungi Anda dalam 1x24 jam kerja</p>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        * Perhitungan estimasi berdasarkan rata-rata data Indonesia. Hasil aktual dapat berbeda tergantung lokasi dan kondisi site.
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <span>© 2025 Enter365. All rights reserved.</span>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.solar-calculator {
  --primary: #f97316;
  --primary-dark: #ea580c;
  --secondary: #0ea5e9;
  --success: #22c55e;
  --success-dark: #16a34a;
  --amber: #f59e0b;
  --dark: #1e293b;
  --gray: #64748b;
  --light: #f8fafc;
  --card-bg: rgba(255, 255, 255, 0.95);

  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #fef3c7 0%, #fff7ed 30%, #ecfdf5 70%, #f0fdfa 100%);
  position: relative;
  overflow-x: hidden;
}

/* Background Pattern */
.bg-pattern {
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(249, 115, 22, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(34, 197, 94, 0.06) 0%, transparent 50%);
  pointer-events: none;
}

.floating-elements {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.sun-glow {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* Header */
.header {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 640px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--amber) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--dark);
}

.logo-subtitle {
  font-size: 0.75rem;
  color: var(--gray);
}

/* Main Content */
.main-content {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

/* Hero */
.hero {
  text-align: center;
  margin-bottom: 2rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--success) 0%, #10b981 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--dark);
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.hero-title .highlight {
  background: linear-gradient(135deg, var(--primary) 0%, var(--amber) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  color: var(--gray);
  font-size: 1rem;
}

/* Calculator Card */
.calculator-card {
  background: var(--card-bg);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 20px 50px -12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.form-section {
  margin-bottom: 1.75rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.step-badge {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--amber) 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.section-title {
  font-weight: 600;
  color: var(--dark);
}

/* Bill Input */
.bill-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-prefix {
  position: absolute;
  left: 1.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray);
}

.bill-input {
  width: 100%;
  padding: 1.25rem 1.25rem 1.25rem 3.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--dark);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  transition: all 0.2s;
}

.bill-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
}

.bill-input::placeholder {
  color: #cbd5e1;
}

.input-hint {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--gray);
}

/* Power Selection Grid */
.power-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.power-card {
  position: relative;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.power-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.power-card.selected {
  border-color: var(--primary);
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}

.power-card.popular::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--amber));
  z-index: -1;
  opacity: 0;
  transition: opacity 0.2s;
}

.power-card.popular.selected::before {
  opacity: 1;
}

.popular-badge {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--primary), var(--amber));
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 100px;
  text-transform: uppercase;
}

.power-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.power-label {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--dark);
}

.power-desc {
  font-size: 0.7rem;
  color: var(--gray);
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* Savings Section */
.savings-section {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  margin: 0 -1.5rem;
  padding: 1.5rem !important;
  border-radius: 0;
}

.savings-display {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.sun-animation {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  transition: transform 0.3s ease;
}

.sun-core {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--amber) 0%, var(--primary) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(249, 115, 22, 0.4),
    0 0 80px rgba(249, 115, 22, 0.2);
  animation: sunPulse 2s ease-in-out infinite;
}

@keyframes sunPulse {
  0%, 100% { box-shadow: 0 0 40px rgba(249, 115, 22, 0.4), 0 0 80px rgba(249, 115, 22, 0.2); }
  50% { box-shadow: 0 0 60px rgba(249, 115, 22, 0.5), 0 0 100px rgba(249, 115, 22, 0.3); }
}

.sun-icon {
  width: 40px;
  height: 40px;
  color: white;
}

.savings-amount {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--success-dark);
}

.savings-percent {
  font-size: 0.9rem;
  color: var(--gray);
}

/* Slider */
.slider-container {
  position: relative;
  padding-top: 8px;
}

.savings-slider {
  width: 100%;
  height: 12px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.slider-track {
  position: absolute;
  top: 8px;
  left: 0;
  right: 0;
  height: 12px;
  background: #d1d5db;
  border-radius: 100px;
  overflow: hidden;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success) 0%, #10b981 100%);
  border-radius: 100px;
  transition: width 0.1s;
}

.savings-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  cursor: pointer;
  transition: transform 0.2s;
}

.savings-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.savings-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  cursor: pointer;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray);
}

/* Calculate Button */
.calculate-btn {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.35);
  margin-top: 0.5rem;
}

.calculate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(249, 115, 22, 0.45);
}

.calculate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-content .arrow {
  transition: transform 0.2s;
}

.calculate-btn:hover .arrow {
  transform: translateX(4px);
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  color: #dc2626;
  margin-top: 1rem;
  font-size: 0.9rem;
}

/* Results Section */
.results-section {
  margin-top: 2rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.results-section.show {
  opacity: 1;
  transform: translateY(0);
}

.results-header {
  text-align: center;
  background: var(--card-bg);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.celebration-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--amber) 0%, var(--primary) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 1rem;
  box-shadow: 0 0 40px rgba(249, 115, 22, 0.3);
  animation: celebratePulse 1.5s ease-in-out infinite;
}

@keyframes celebratePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.results-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--dark);
  margin-bottom: 0.25rem;
}

.results-subtitle {
  color: var(--gray);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.big-savings {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--success-dark);
}

.per-month {
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-card.green { border-top: 3px solid var(--success); }
.stat-card.blue { border-top: 3px solid var(--secondary); }
.stat-card.amber { border-top: 3px solid var(--amber); }

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
}

.stat-card.green .stat-icon { background: #dcfce7; color: var(--success); }
.stat-card.blue .stat-icon { background: #e0f2fe; color: var(--secondary); }
.stat-card.amber .stat-icon { background: #fef3c7; color: var(--amber); }

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--dark);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--gray);
  margin-top: 0.25rem;
}

/* Comparison Card */
.comparison-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.comparison-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 1rem;
  text-align: center;
}

.comparison-visual {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bill-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bar-label {
  width: 60px;
  font-size: 0.75rem;
  color: var(--gray);
}

.bar-fill {
  height: 28px;
  border-radius: 8px;
  transition: width 0.5s ease;
}

.bill-bar.before .bar-fill {
  background: #fecaca;
}

.bill-bar.after .bar-fill {
  background: linear-gradient(90deg, var(--success), #10b981);
}

.bar-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dark);
  white-space: nowrap;
}

/* Lifetime Banner */
.lifetime-banner {
  background: linear-gradient(135deg, var(--success) 0%, #10b981 100%);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  margin-bottom: 1rem;
}

.lifetime-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}

.lifetime-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.lifetime-value {
  font-size: 2rem;
  font-weight: 800;
}

.banner-decoration {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
}

/* Investment Card */
.investment-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.investment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.investment-label {
  color: var(--gray);
  font-size: 0.85rem;
}

.investment-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--secondary);
}

.investment-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.detail-item {
  background: #f1f5f9;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--dark);
}

/* Eco Card */
.eco-card {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.eco-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--success-dark);
  margin-bottom: 1rem;
}

.eco-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.eco-stat {
  text-align: center;
}

.eco-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--success-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}

.eco-label {
  font-size: 0.75rem;
  color: var(--gray);
  margin-top: 0.25rem;
}

/* Details Accordion */
.details-accordion {
  background: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: var(--dark);
}

.accordion-content {
  padding: 0 1.25rem 1.25rem;
  border-top: 1px solid #e2e8f0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  padding-top: 1rem;
}

.detail-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray);
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row span:first-child {
  color: var(--gray);
}

.detail-row span:last-child {
  font-weight: 600;
  color: var(--dark);
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.cta-subtitle {
  opacity: 0.9;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: var(--secondary);
  padding: 1rem 2rem;
  border-radius: 100px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* Lead Form */
.lead-form {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
}

.close-form {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--gray);
}

.form-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 1rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  color: var(--dark);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--secondary);
}

.form-input::placeholder {
  color: #94a3b8;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Success Message */
.success-message {
  text-align: center;
  padding: 1rem;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
}

.success-message h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.success-message p {
  opacity: 0.9;
  font-size: 0.9rem;
}

/* Disclaimer */
.disclaimer {
  text-align: center;
  font-size: 0.75rem;
  color: var(--gray);
  margin-top: 2rem;
  padding: 0 1rem;
}

/* Footer */
.footer {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
  font-size: 0.8rem;
}

/* Mobile Optimizations */
@media (max-width: 480px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .power-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .power-card {
    padding: 0.875rem 0.5rem;
  }

  .bill-input {
    font-size: 1.5rem;
    padding: 1rem 1rem 1rem 3rem;
  }

  .currency-prefix {
    font-size: 1rem;
    left: 1rem;
  }

  .savings-amount {
    font-size: 2rem;
  }

  .big-savings {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .stat-card {
    padding: 0.75rem 0.5rem;
  }

  .stat-value {
    font-size: 1rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
