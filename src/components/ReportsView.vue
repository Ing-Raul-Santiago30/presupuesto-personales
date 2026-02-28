<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useBudgetStore } from '../composables/useBudgetStore'
import { Doughnut, Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

const store = useBudgetStore()
const activeChart = ref<'distribution' | 'daily' | 'income-expense' | 'trend'>('distribution')

// Detect theme from DOM
const isDark = computed(() => document.documentElement.getAttribute('data-theme') !== 'light')
const chartTextColor = computed(() => isDark.value ? '#9ca3af' : '#64748b')
const chartGridColor = computed(() => isDark.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
const chartTooltipBg = computed(() => isDark.value ? '#1e1e3c' : '#ffffff')
const chartTooltipText = computed(() => isDark.value ? '#f0f0ff' : '#1e293b')

// Doughnut Chart - Expense Distribution
const doughnutData = computed(() => {
  const cats = store.budgets.value.filter(b => b.type === 'expense')
  const labels: string[] = []
  const data: number[] = []
  const colors: string[] = []

  cats.forEach(cat => {
    const spent = store.expensesByCategory.value[cat.name]
    if (spent && spent > 0) {
      labels.push(`${cat.icon} ${cat.name}`)
      data.push(spent)
      colors.push(cat.color)
    }
  })

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderColor: colors.map(c => c + '40'),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }
})

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: chartTextColor.value,
        font: { family: 'Inter', size: 12 },
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 12,
      },
    },
    tooltip: {
      backgroundColor: chartTooltipBg.value,
      titleColor: chartTooltipText.value,
      bodyColor: chartTextColor.value,
      borderColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Inter', weight: 'bold' as const },
      bodyFont: { family: 'Inter' },
    },
  },
  cutout: '65%',
}))

// Bar Chart - Daily Expenses
const barData = computed(() => {
  const [year, month] = store.currentMonth.value.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const labels: string[] = []
  const data: number[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    labels.push(String(d))
    data.push(store.dailyExpenses.value[String(d).padStart(2, '0')] || 0)
  }

  return {
    labels,
    datasets: [{
      label: 'Gastos Diarios',
      data,
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 4,
      hoverBackgroundColor: 'rgba(99, 102, 241, 0.8)',
    }],
  }
})

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: chartTooltipBg.value,
      titleColor: chartTooltipText.value,
      bodyColor: chartTextColor.value,
      borderColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Inter', weight: 'bold' as const },
      bodyFont: { family: 'Inter' },
    },
  },
  scales: {
    x: {
      grid: { color: chartGridColor.value },
      ticks: { color: chartTextColor.value, font: { family: 'Inter', size: 10 } },
    },
    y: {
      grid: { color: chartGridColor.value },
      ticks: { color: chartTextColor.value, font: { family: 'Inter', size: 10 } },
    },
  },
}))

// Income vs Expenses
const incomeExpenseData = computed(() => {
  const incCats = store.budgets.value.filter(b => b.type === 'income')
  const expCats = store.budgets.value.filter(b => b.type === 'expense')

  const incLabels: string[] = []
  const incData: number[] = []
  incCats.forEach(cat => {
    const amount = store.incomeByCategory.value[cat.name]
    if (amount && amount > 0) {
      incLabels.push(`${cat.icon} ${cat.name}`)
      incData.push(amount)
    }
  })

  const expLabels: string[] = []
  const expData: number[] = []
  expCats.forEach(cat => {
    const amount = store.expensesByCategory.value[cat.name]
    if (amount && amount > 0) {
      expLabels.push(`${cat.icon} ${cat.name}`)
      expData.push(amount)
    }
  })

  const allLabels = [...incLabels, ...expLabels]
  const allData = [...incData.map(d => d), ...expData.map(d => -d)]
  const allColors = [
    ...incData.map(() => 'rgba(16, 185, 129, 0.6)'),
    ...expData.map(() => 'rgba(239, 68, 68, 0.6)'),
  ]

  return {
    labels: allLabels,
    datasets: [{
      data: allData,
      backgroundColor: allColors,
      borderColor: allColors.map(c => c.replace('0.6', '1')),
      borderWidth: 1,
      borderRadius: 4,
    }],
  }
})

const incomeExpenseOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: chartTooltipBg.value,
      titleColor: chartTooltipText.value,
      bodyColor: chartTextColor.value,
      borderColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => {
          const val = Math.abs(ctx.raw)
          return `${store.currency.value}${val.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { color: chartGridColor.value },
      ticks: { color: chartTextColor.value, font: { family: 'Inter', size: 10 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: chartTextColor.value, font: { family: 'Inter', size: 11 } },
    },
  },
}))

// Cumulative spending line
const cumulativeData = computed(() => {
  const [year, month] = store.currentMonth.value.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const labels: string[] = []
  const cumExpense: number[] = []
  const cumIncome: number[] = []

  let runningExpense = 0
  let runningIncome = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0')
    labels.push(String(d))

    const dayTxs = store.transactions.value.filter(t => t.date.split('-')[2] === dayStr)
    dayTxs.forEach(t => {
      if (t.type === 'expense') runningExpense += t.amount
      else runningIncome += t.amount
    })

    cumExpense.push(runningExpense)
    cumIncome.push(runningIncome)
  }

  return {
    labels,
    datasets: [
      {
        label: 'Ingresos Acumulados',
        data: cumIncome,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Gastos Acumulados',
        data: cumExpense,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  }
})

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      labels: {
        color: chartTextColor.value,
        font: { family: 'Inter', size: 12 },
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: chartTooltipBg.value,
      titleColor: chartTooltipText.value,
      bodyColor: chartTextColor.value,
      borderColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: chartGridColor.value },
      ticks: { color: chartTextColor.value, font: { family: 'Inter', size: 10 } },
    },
    y: {
      grid: { color: chartGridColor.value },
      ticks: { color: chartTextColor.value, font: { family: 'Inter', size: 10 } },
    },
  },
}))

// Stats summary
const avgDailyExpense = computed(() => {
  const txs = store.transactions.value.filter(t => t.type === 'expense')
  if (txs.length === 0) return 0
  const days = new Set(txs.map(t => t.date)).size
  return store.totalExpenses.value / (days || 1)
})

const largestExpense = computed(() => {
  const txs = store.transactions.value.filter(t => t.type === 'expense')
  if (txs.length === 0) return null
  return txs.reduce((max, t) => t.amount > max.amount ? t : max, txs[0])
})
</script>

<template>
  <div class="reports-view">
    <div class="view-header">
      <div>
        <h1 class="page-title">Reportes</h1>
        <p class="page-subtitle">{{ store.getMonthName(store.currentMonth.value) }}</p>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="quick-stat glass-card">
        <p class="qs-label">Gasto Diario Promedio</p>
        <p class="qs-value">{{ store.formatCurrency(avgDailyExpense) }}</p>
      </div>
      <div class="quick-stat glass-card">
        <p class="qs-label">Mayor Gasto</p>
        <p class="qs-value" v-if="largestExpense">{{ store.formatCurrency(largestExpense.amount) }}</p>
        <p class="qs-desc" v-if="largestExpense">{{ largestExpense.description }}</p>
        <p class="qs-value" v-else>—</p>
      </div>
      <div class="quick-stat glass-card">
        <p class="qs-label">Tasa de Ahorro</p>
        <p class="qs-value" :class="store.savingsRate.value >= 0 ? 'positive' : 'negative'">
          {{ store.savingsRate.value.toFixed(1) }}%
        </p>
      </div>
      <div class="quick-stat glass-card">
        <p class="qs-label">Categorías con Gasto</p>
        <p class="qs-value">{{ Object.keys(store.expensesByCategory.value).length }}</p>
      </div>
    </div>

    <!-- Chart Tabs -->
    <div class="chart-tabs">
      <button
        class="chart-tab"
        :class="{ active: activeChart === 'distribution' }"
        @click="activeChart = 'distribution'"
      >🍩 Distribución</button>
      <button
        class="chart-tab"
        :class="{ active: activeChart === 'daily' }"
        @click="activeChart = 'daily'"
      >📊 Gastos Diarios</button>
      <button
        class="chart-tab"
        :class="{ active: activeChart === 'trend' }"
        @click="activeChart = 'trend'"
      >📈 Tendencia</button>
      <button
        class="chart-tab"
        :class="{ active: activeChart === 'income-expense' }"
        @click="activeChart = 'income-expense'"
      >⚖️ Ingresos vs Gastos</button>
    </div>

    <!-- Chart Container -->
    <div class="chart-container glass-card">
      <div class="chart-wrapper" v-if="activeChart === 'distribution'">
        <h3 class="chart-title">Distribución de Gastos por Categoría</h3>
        <div class="chart-area" v-if="Object.keys(store.expensesByCategory.value).length > 0">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </div>
        <div class="empty-state" v-else>
          <span class="empty-state-icon">📊</span>
          <p class="empty-state-text">No hay datos para mostrar</p>
        </div>
      </div>

      <div class="chart-wrapper" v-if="activeChart === 'daily'">
        <h3 class="chart-title">Gastos por Día del Mes</h3>
        <div class="chart-area">
          <Bar :data="barData" :options="barOptions" />
        </div>
      </div>

      <div class="chart-wrapper" v-if="activeChart === 'trend'">
        <h3 class="chart-title">Tendencia Acumulada del Mes</h3>
        <div class="chart-area">
          <Line :data="cumulativeData" :options="lineOptions" />
        </div>
      </div>

      <div class="chart-wrapper" v-if="activeChart === 'income-expense'">
        <h3 class="chart-title">Ingresos vs Gastos por Categoría</h3>
        <div class="chart-area" v-if="incomeExpenseData.labels.length > 0">
          <Bar :data="incomeExpenseData" :options="incomeExpenseOptions" />
        </div>
        <div class="empty-state" v-else>
          <span class="empty-state-icon">⚖️</span>
          <p class="empty-state-text">No hay datos para comparar</p>
        </div>
      </div>
    </div>

    <!-- Category Breakdown Table -->
    <div class="section" v-if="Object.keys(store.expensesByCategory.value).length > 0">
      <h2 class="section-title">📋 Desglose por Categoría</h2>
      <div class="glass-card breakdown-table">
        <div class="table-header">
          <span class="th-cat">Categoría</span>
          <span class="th-amount">Monto</span>
          <span class="th-pct">% del Total</span>
          <span class="th-bar">Proporción</span>
        </div>
        <div
          v-for="[catName, amount] in Object.entries(store.expensesByCategory.value).sort((a, b) => b[1] - a[1])"
          :key="catName"
          class="table-row"
        >
          <span class="td-cat">
            <span class="td-cat-icon">{{ store.budgets.value.find(b => b.name === catName)?.icon || '📦' }}</span>
            {{ catName }}
          </span>
          <span class="td-amount">{{ store.formatCurrency(amount) }}</span>
          <span class="td-pct">{{ ((amount / store.totalExpenses.value) * 100).toFixed(1) }}%</span>
          <span class="td-bar">
            <div class="mini-bar">
              <div
                class="mini-bar-fill"
                :style="{
                  width: ((amount / store.totalExpenses.value) * 100) + '%',
                  background: store.budgets.value.find(b => b.name === catName)?.color || '#6366f1',
                }"
              ></div>
            </div>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-view {
  padding: var(--space-xl);
  max-width: 1100px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: var(--space-xl);
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  text-transform: capitalize;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.quick-stat {
  padding: var(--space-lg);
  text-align: center;
}

.qs-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.qs-value {
  font-size: 1.4rem;
  font-weight: 800;
}

.qs-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.positive { color: var(--success); }
.negative { color: var(--danger); }

/* Chart Tabs */
.chart-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: var(--space-md);
  overflow-x: auto;
  padding-bottom: 4px;
}

.chart-tab {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.chart-tab.active {
  background: var(--accent-primary);
  color: #fff;
}

.chart-tab:hover:not(.active) {
  background: var(--bg-input-focus);
  color: var(--text-primary);
}

/* Chart Container */
.chart-container {
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.chart-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: var(--space-lg);
  color: var(--text-secondary);
}

.chart-area {
  height: 350px;
  position: relative;
}

/* Breakdown Table */
.section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: var(--space-md);
}

.breakdown-table {
  padding: 0;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-input);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-color);
  align-items: center;
  transition: background var(--transition-fast);
}

.table-row:hover {
  background: var(--bg-input);
}

.td-cat {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
  font-size: 0.9rem;
}

.td-cat-icon {
  font-size: 1.1rem;
}

.td-amount {
  font-weight: 700;
  font-size: 0.9rem;
}

.td-pct {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.td-bar {
  display: flex;
  align-items: center;
}

.mini-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-input);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}

@media (max-width: 768px) {
  .reports-view {
    padding: var(--space-md);
  }

  .quick-stats {
    grid-template-columns: 1fr 1fr;
  }

  .chart-area {
    height: 280px;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1.5fr 1fr 1fr;
  }

  .th-bar, .td-bar {
    display: none;
  }
}
</style>
