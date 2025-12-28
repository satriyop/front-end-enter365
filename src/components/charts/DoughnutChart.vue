<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

defineProps<{
  labels: string[]
  data: number[]
  backgroundColor?: string[]
  height?: number
}>()

const defaultColors = [
  '#f97316', // orange-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
]
</script>

<template>
  <div :style="{ height: `${height || 250}px`, position: 'relative' }">
    <Doughnut
      :data="{
        labels,
        datasets: [{
          data,
          backgroundColor: backgroundColor || defaultColors.slice(0, data.length),
          borderWidth: 0,
        }],
      }"
      :options="{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              usePointStyle: true,
              padding: 15,
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${context.label}: ${new Intl.NumberFormat('id-ID').format(value)} (${percentage}%)`
              },
            },
          },
        },
        cutout: '60%',
      }"
    />
  </div>
</template>
