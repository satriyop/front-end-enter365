<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksAnalysis } from '@/api/useTaskAnalysis'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { toLocalISODate } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const from = ref('')
const to = ref('')
const filters = computed(() => ({
  from: from.value || undefined,
  to: to.value || undefined,
}))
const { data: report, isPending, isError, error } = useTasksAnalysis(filters)

const statusColumns: ResponsiveColumn[] = [
  { key: 'status', label: 'Status', mobilePriority: 1 },
  { key: 'count', label: 'Count', mobilePriority: 2 },
  { key: 'overdue', label: 'Overdue', mobilePriority: 3 },
]
const projectColumns: ResponsiveColumn[] = [
  { key: 'project_name', label: 'Project', mobilePriority: 1 },
  { key: 'count', label: 'Tasks', mobilePriority: 2 },
  { key: 'done', label: 'Done', showInMobile: false },
  { key: 'overdue', label: 'Overdue', mobilePriority: 3 },
]
const assigneeColumns: ResponsiveColumn[] = [
  { key: 'name', label: 'Assignee', mobilePriority: 1 },
  { key: 'count', label: 'Tasks', mobilePriority: 2 },
  { key: 'done', label: 'Done', mobilePriority: 3 },
]

function setThisMonth() {
  const now = new Date()
  from.value = toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1))
  to.value = toLocalISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Tasks Analysis</h1>
        <p class="text-muted-foreground mt-1">Status, priority, project, and assignee breakdown.</p>
      </div>
      <Button variant="outline" @click="router.push('/reports')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
    </div>
    <Card>
      <div class="p-6 flex flex-wrap gap-4 items-end">
        <div>
          <label class="block text-sm font-medium mb-2">From</label>
          <Input v-model="from" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">To</label>
          <Input v-model="to" type="date" />
        </div>
        <Button variant="outline" size="sm" @click="setThisMonth">This Month</Button>
      </div>
    </Card>
    <div v-if="isPending" class="text-center py-12 text-muted-foreground">Loading tasks analysis...</div>
    <Card v-else-if="isError" class="p-6 text-center text-destructive">
      {{ error?.message || 'Failed to load analysis' }}
    </Card>
    <template v-else-if="report">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card class="p-6 text-center">
          <div class="text-3xl font-bold">{{ report.totals.count }}</div>
          <div class="text-sm text-muted-foreground mt-1">Tasks</div>
        </Card>
        <Card class="p-6 text-center">
          <div class="text-3xl font-bold">{{ report.totals.done }}</div>
          <div class="text-sm text-muted-foreground mt-1">Done</div>
        </Card>
        <Card class="p-6 text-center">
          <div class="text-3xl font-bold text-red-600 dark:text-red-400">{{ report.totals.overdue }}</div>
          <div class="text-sm text-muted-foreground mt-1">Overdue</div>
        </Card>
        <Card class="p-6 text-center">
          <div class="text-3xl font-bold">{{ report.totals.completion_rate }}%</div>
          <div class="text-sm text-muted-foreground mt-1">Completion</div>
        </Card>
      </div>
      <Card class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">By Status</h2>
        <ResponsiveTable :items="report.by_status" :columns="statusColumns" row-key="status" />
      </Card>
      <Card class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">By Project</h2>
        <ResponsiveTable :items="report.by_project" :columns="projectColumns" row-key="project_id" />
      </Card>
      <Card class="p-6 space-y-3">
        <h2 class="text-lg font-semibold">By Assignee</h2>
        <ResponsiveTable :items="report.by_assignee" :columns="assigneeColumns" row-key="name" />
      </Card>
    </template>
  </div>
</template>
