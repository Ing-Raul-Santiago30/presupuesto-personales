<script setup lang="ts">
import { useBudgetStore } from '../composables/useBudgetStore'
import { computed } from 'vue'

const store = useBudgetStore()

const monthLabel = computed(() => store.getMonthName(store.currentMonth.value))

const balanceClass = computed(() => {
  if (store.balance.value > 0) return 'positive'
  if (store.balance.value < 0) return 'negative'
  return ''
})

const savingsRateClass = computed(() => {
  if (store.savingsRate.value >= 20) return 'badge-success'
  if (store.savingsRate.value >= 10) return 'badge-warning'
  return 'badge-danger'
})

const topExpenseCategories = computed(() => {
  const entries = Object.entries(store.expensesByCategory.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const budgets = store.budgets.value
  return entries.map(([name, amount]) => {
    const cat = budgets.find(b => b.name === name)
    return {
      name,
      amount,
      icon: cat?.icon || '📦',
      color: cat?.color || '#78716c',
      percentage: store.totalExpenses.value > 0
        ? (amount / store.totalExpenses.value) * 100
        : 0,
    }
  })
})

const alerts = computed(() => {
  const items: { type: string; message: string; icon: string }[] = []
  store.budgetUtilization.value.forEach(b => {
    if (b.percentage >= 100) {
      items.push({
        type: 'danger',
        message: `${b.icon} ${b.name}: ¡Presupuesto excedido!`,
        icon: '🚨',
      })
    } else if (b.percentage >= 80) {
      items.push({
        type: 'warning',
        message: `${b.icon} ${b.name}: ${b.percentage.toFixed(0)}% utilizado`,
        icon: '⚠️',
      })
    }
  })
  if (store.balance.value < 0) {
    items.push({
      type: 'danger',
      message: 'Balance negativo este mes',
      icon: '🔴',
    })
  }
  return items
})
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">{{ monthLabel }}</p>
      </div>
    </div>

    <!-- Alerts -->
    <div class="alerts-section" v-if="alerts.length > 0">
      <div
        v-for="(alert, idx) in alerts"
        :key="idx"
        class="alert-item"
        :class="`alert-${alert.type}`"
      >
        <span>{{ alert.icon }}</span>
        <span>{{ alert.message }}</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid stagger">
      <div class="stat-card animate-fade-in-up">
        <div class="stat-header">
          <span class="stat-icon income-icon">💰</span>
          <span class="stat-label">Ingresos</span>
        </div>
        <p class="stat-value income-value">{{ store.formatCurrency(store.totalIncome.value) }}</p>
        <div class="stat-bar">
          <div class="stat-bar-fill income-bar" style="width: 100%"></div>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up">
        <div class="stat-header">
          <span class="stat-icon expense-icon">💸</span>
          <span class="stat-label">Gastos</span>
        </div>
        <p class="stat-value expense-value">{{ store.formatCurrency(store.totalExpenses.value) }}</p>
        <div class="stat-bar">
          <div
            class="stat-bar-fill expense-bar"
            :style="{ width: store.totalIncome.value > 0 ? Math.min((store.totalExpenses.value / store.totalIncome.value) * 100, 100) + '%' : '0%' }"
          ></div>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up">
        <div class="stat-header">
          <span class="stat-icon balance-icon">📊</span>
          <span class="stat-label">Balance</span>
        </div>
        <p class="stat-value" :class="balanceClass">{{ store.formatCurrency(store.balance.value) }}</p>
        <span class="badge" :class="savingsRateClass">
          Ahorro: {{ store.savingsRate.value.toFixed(1) }}%
        </span>
      </div>

      <div class="stat-card animate-fade-in-up">
        <div class="stat-header">
          <span class="stat-icon tx-icon">📝</span>
          <span class="stat-label">Transacciones</span>
        </div>
        <p class="stat-value">{{ store.transactions.value.length }}</p>
        <span class="badge badge-info">Este mes</span>
      </div>
    </div>

    <!-- Budget Utilization -->
    <div class="section" v-if="store.budgetUtilization.value.length > 0">
      <h2 class="section-title">🎯 Uso de Presupuestos</h2>
      <div class="budget-usage-grid stagger">
        <div
          v-for="budget in store.budgetUtilization.value"
          :key="budget.id"
          class="budget-usage-card glass-card animate-fade-in-up"
        >
          <div class="budget-usage-header">
            <div class="budget-usage-info">
              <span class="budget-usage-icon">{{ budget.icon }}</span>
              <div>
                <p class="budget-usage-name">{{ budget.name }}</p>
                <p class="budget-usage-detail">
                  {{ store.formatCurrency(budget.spent) }} / {{ store.formatCurrency(budget.limit) }}
                </p>
              </div>
            </div>
            <span
              class="badge"
              :class="{
                'badge-danger': budget.percentage >= 100,
                'badge-warning': budget.percentage >= 80 && budget.percentage < 100,
                'badge-success': budget.percentage < 80,
              }"
            >
              {{ budget.percentage.toFixed(0) }}%
            </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{
                danger: budget.percentage >= 100,
                warning: budget.percentage >= 80 && budget.percentage < 100,
                success: budget.percentage < 80,
              }"
              :style="{ width: Math.min(budget.percentage, 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="two-columns">
      <!-- Top Expenses -->
      <div class="section">
        <h2 class="section-title">🔥 Gastos Principales</h2>
        <div class="glass-card top-expenses-card" v-if="topExpenseCategories.length > 0">
          <div
            v-for="(cat, idx) in topExpenseCategories"
            :key="cat.name"
            class="top-expense-item"
          >
            <div class="top-expense-rank">{{ idx + 1 }}</div>
            <span class="top-expense-icon">{{ cat.icon }}</span>
            <div class="top-expense-info">
              <p class="top-expense-name">{{ cat.name }}</p>
              <div class="progress-bar" style="height: 4px;">
                <div
                  class="progress-fill"
                  :style="{ width: cat.percentage + '%', background: cat.color }"
                ></div>
              </div>
            </div>
            <div class="top-expense-amount">
              <p>{{ store.formatCurrency(cat.amount) }}</p>
              <span class="top-expense-pct">{{ cat.percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        <div class="glass-card empty-state" v-else>
          <span class="empty-state-icon">📭</span>
          <p class="empty-state-text">No hay gastos registrados</p>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="section">
        <h2 class="section-title">🕐 Transacciones Recientes</h2>
        <div class="glass-card recent-tx-card" v-if="store.recentTransactions.value.length > 0">
          <div
            v-for="tx in store.recentTransactions.value"
            :key="tx.id"
            class="recent-tx-item"
          >
            <div class="recent-tx-type" :class="tx.type">
              {{ tx.type === 'income' ? '↗' : '↘' }}
            </div>
            <div class="recent-tx-info">
              <p class="recent-tx-desc">{{ tx.description }}</p>
              <p class="recent-tx-cat">{{ tx.category }} · {{ new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) }}</p>
            </div>
            <p class="recent-tx-amount" :class="tx.type">
              {{ tx.type === 'income' ? '+' : '-' }}{{ store.formatCurrency(tx.amount) }}
            </p>
          </div>
        </div>
        <div class="glass-card empty-state" v-else>
          <span class="empty-state-icon">📭</span>
          <p class="empty-state-text">No hay transacciones aún</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
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

/* Alerts */
.alerts-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.alert-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
  animation: fadeInUp 0.3s ease;
}

.alert-danger {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.alert-warning {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.stat-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all var(--transition-base);
  opacity: 0;
}

.stat-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.income-icon { background: var(--success-bg); }
.expense-icon { background: var(--danger-bg); }
.balance-icon { background: var(--info-bg); }
.tx-icon { background: rgba(139, 92, 246, 0.1); }

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: var(--space-sm);
  letter-spacing: -0.02em;
}

.income-value { color: var(--success); }
.expense-value { color: var(--danger); }
.positive { color: var(--success); }
.negative { color: var(--danger); }

.stat-bar {
  height: 4px;
  background: var(--bg-input);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-sm);
}

.stat-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.8s ease;
}

.income-bar { background: var(--success); }
.expense-bar { background: var(--danger); }

/* Budget Usage */
.budget-usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}

.budget-usage-card {
  padding: var(--space-md);
  opacity: 0;
}

.budget-usage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.budget-usage-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.budget-usage-icon {
  font-size: 1.3rem;
}

.budget-usage-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.budget-usage-detail {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* Two Columns */
.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: var(--space-md);
}

/* Top Expenses */
.top-expenses-card {
  padding: var(--space-md);
}

.top-expense-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
}

.top-expense-item + .top-expense-item {
  border-top: 1px solid var(--border-color);
}

.top-expense-rank {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.top-expense-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.top-expense-info {
  flex: 1;
  min-width: 0;
}

.top-expense-name {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.top-expense-amount {
  text-align: right;
  flex-shrink: 0;
}

.top-expense-amount p {
  font-weight: 700;
  font-size: 0.9rem;
}

.top-expense-pct {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Recent Transactions */
.recent-tx-card {
  padding: var(--space-sm);
}

.recent-tx-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.recent-tx-item:hover {
  background: var(--bg-input);
}

.recent-tx-type {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.recent-tx-type.income {
  background: var(--success-bg);
  color: var(--success);
}

.recent-tx-type.expense {
  background: var(--danger-bg);
  color: var(--danger);
}

.recent-tx-info {
  flex: 1;
  min-width: 0;
}

.recent-tx-desc {
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-tx-cat {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.recent-tx-amount {
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.recent-tx-amount.income { color: var(--success); }
.recent-tx-amount.expense { color: var(--danger); }

@media (max-width: 900px) {
  .two-columns {
    grid-template-columns: 1fr;
  }

  .dashboard {
    padding: var(--space-md);
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 500px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
