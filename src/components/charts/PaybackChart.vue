<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, annotationPlugin)

const props = defineProps<{
  /** Cumulative cash flow data for each year (can be negative initially) */
  cumulativeCashFlow: number[]
  /** Year when payback occurs (for the annotation line) */
  paybackYear?: number
  /** Chart height in pixels */
  height?: number
}>()

const chartData = computed(() => {
  const labels = props.cumulativeCashFlow.map((_, i) => `Y${i + 1}`)

  // Separate positive and negative values for different colors
  const positiveData = props.cumulativeCashFlow.map(v => v >= 0 ? v : null)
  const negativeData = props.cumulativeCashFlow.map(v => v < 0 ? v : null)

  return {
    labels,
    datasets: [
      {
        label: 'Profit',
        data: positiveData,
        backgroundColor: '#22c55e', // green-500
        borderRadius: 4,
      },
      {
        label: 'Investment Recovery',
        data: negativeData,
        backgroundColor: '#ef4444', // red-500
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const value = context.raw || 0
          return `${context.dataset.label}: Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(value))}`
        },
      },
    },
    annotation: props.paybackYear ? {
      annotations: {
        paybackLine: {
          type: 'line' as const,
          xMin: props.paybackYear - 0.5,
          xMax: props.paybackYear - 0.5,
          borderColor: '#f59e0b',
          borderWidth: 3,
          borderDash: [6, 6],
          label: {
            display: true,
            content: 'Payback',
            position: 'start' as const,
            backgroundColor: '#fef08a',
            color: '#92400e',
            font: {
              weight: 'bold' as const,
              size: 12,
            },
            padding: 6,
          },
        },
      },
    } : {},
  },
  scales: {
    x: {
      stacked: false,
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: false,
      ticks: {
        callback: function(value: any) {
          const absValue = Math.abs(value)
          if (absValue >= 1000000000) {
            return `${(value / 1000000000).toFixed(1)} M`
          }
          if (absValue >= 1000000) {
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
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
