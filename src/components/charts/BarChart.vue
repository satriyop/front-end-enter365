<script setup lang="ts">
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

defineProps<{
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
  height?: number
}>()
</script>

<template>
  <Bar
    :data="{ labels, datasets }"
    :options="{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('id-ID', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(Number(value))
            },
          },
        },
      },
    }"
    :style="{ height: `${height || 300}px` }"
  />
</template>
