<script setup lang="ts">
import { computed } from 'vue'
import { Chart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale)

const props = defineProps<{
  /** Monthly bill before solar (all 12 months same if no data) */
  billBefore: number
  /** Monthly bill after solar (remaining PLN bill) */
  billAfter: number
  /** Monthly solar production in kWh */
  monthlyProductionKwh: number
  /** Electricity rate per kWh */
  electricityRate: number
  /** Chart height in pixels */
  height?: number
}>()

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const chartData = computed(() => {
  // Before solar (Jan-Jun): full bill as yellow bar
  // After solar (Jul-Dec): green (savings) + yellow (remaining bill) as GROUPED bars

  // For CHART visualization: Green + Yellow should equal Original Bill
  // So savings shown = billBefore - billAfter (what was actually saved from the bill)
  const savingsForChart = props.billBefore - props.billAfter

  // Yellow bars: Before=full bill, After=remaining bill
  const plnBillData = months.map((_, i) => i < 6 ? props.billBefore : props.billAfter)

  // Green bars: Only for Jul-Dec showing actual bill savings
  const savingsData = months.map((_, i) => i >= 6 ? savingsForChart : null)

  // Trend line: Shows the PLN bill trend (dotted line)
  // Before solar: bill stays same, After solar: lower bill
  const trendLineData = months.map((_, i) => {
    if (i < 6) return props.billBefore
    return props.billAfter
  })

  return {
    labels: months,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Hemat dari Solar',
        data: savingsData,
        backgroundColor: '#22c55e', // green-500
        borderRadius: 4,
        order: 2,
        barPercentage: 0.4,
        categoryPercentage: 0.8,
      },
      {
        type: 'bar' as const,
        label: 'Tagihan PLN',
        data: plnBillData,
        backgroundColor: '#fde047', // yellow-300
        borderColor: '#0ea5e9', // sky-500 border like reference
        borderWidth: 2,
        borderRadius: 4,
        order: 1,
        barPercentage: 0.4,
        categoryPercentage: 0.8,
      },
      {
        type: 'line' as const,
        label: 'Tren Tagihan PLN',
        data: trendLineData,
        borderColor: '#0ea5e9', // sky-500
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0.1,
        order: 0,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const value = context.raw || 0
          if (value === null) return ''
          return `${context.dataset.label}: Rp ${new Intl.NumberFormat('id-ID').format(value)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          if (value >= 1000000000) {
            return `${(value / 1000000000).toFixed(1)}M`
          }
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(0)} jt`
          }
          return new Intl.NumberFormat('id-ID', {
            notation: 'compact',
            compactDisplay: 'short',
          }).format(value)
        },
      },
      grid: {
        color: '#e2e8f0',
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
}))
</script>

<template>
  <div :style="{ height: `${height || 300}px`, position: 'relative' }">
    <Chart type="bar" :data="chartData" :options="chartOptions" />
  </div>
</template>
