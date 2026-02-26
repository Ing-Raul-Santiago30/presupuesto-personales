<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ViewMode } from './types'
import { useBudgetStore } from './composables/useBudgetStore'
import { useAuth } from './composables/useAuth'
import SidebarNav from './components/SidebarNav.vue'
import DashboardView from './components/DashboardView.vue'
import TransactionsView from './components/TransactionsView.vue'
import BudgetsView from './components/BudgetsView.vue'
import ReportsView from './components/ReportsView.vue'
import LoginView from './components/LoginView.vue'

const store = useBudgetStore()
const auth = useAuth()
const currentView = ref<ViewMode>('dashboard')
const showUserMenu = ref(false)

function navigate(view: ViewMode) {
  currentView.value = view
}

// Month navigation
function prevMonth() {
  const [year, month] = store.currentMonth.value.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  store.setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
}

function nextMonth() {
  const [year, month] = store.currentMonth.value.split('-').map(Number)
  const d = new Date(year, month, 1)
  store.setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
}

const monthLabel = computed(() => store.getMonthName(store.currentMonth.value))

function handleLogout() {
  showUserMenu.value = false
  auth.logout()
}
</script>

<template>
  <!-- Login Screen -->
  <LoginView v-if="!auth.isAuthenticated.value" @authenticated="currentView = 'dashboard'" />

  <!-- Main App -->
  <div class="app-layout" v-else>
    <SidebarNav :activeView="currentView" @navigate="navigate" />

    <main class="main-content">
      <!-- Top Bar -->
      <header class="topbar">
        <div class="month-navigator">
          <button class="btn-icon" @click="prevMonth" title="Mes anterior">◀</button>
          <span class="current-month">{{ monthLabel }}</span>
          <button class="btn-icon" @click="nextMonth" title="Mes siguiente">▶</button>
        </div>
        <div class="topbar-right">
          <div class="currency-badge">
            {{ store.currency.value }}
          </div>

          <!-- User Profile -->
          <div class="user-profile" @click="showUserMenu = !showUserMenu" id="user-profile-btn">
            <span class="user-avatar">{{ auth.currentUser.value?.avatar }}</span>
            <span class="user-name">{{ auth.currentUser.value?.name }}</span>
            <span class="user-chevron" :class="{ open: showUserMenu }">▾</span>
          </div>

          <!-- User Dropdown -->
          <div class="user-dropdown" v-if="showUserMenu">
            <div class="dropdown-header">
              <span class="dropdown-avatar">{{ auth.currentUser.value?.avatar }}</span>
              <div>
                <p class="dropdown-name">{{ auth.currentUser.value?.name }}</p>
                <p class="dropdown-email">{{ auth.currentUser.value?.email }}</p>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout-item" @click="handleLogout" id="logout-btn">
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Backdrop for dropdown -->
      <div class="dropdown-backdrop" v-if="showUserMenu" @click="showUserMenu = false"></div>

      <!-- Content Area -->
      <div class="content-area">
        <DashboardView v-if="currentView === 'dashboard'" />
        <TransactionsView v-if="currentView === 'transactions'" />
        <BudgetsView v-if="currentView === 'budgets'" />
        <ReportsView v-if="currentView === 'reports'" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(20px);
}

.month-navigator {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.current-month {
  font-size: 1rem;
  font-weight: 700;
  min-width: 180px;
  text-align: center;
  text-transform: capitalize;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  position: relative;
}

.currency-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
  color: #fff;
  box-shadow: 0 4px 15px var(--accent-glow);
}

/* User Profile */
.user-profile {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 6px 14px 6px 8px;
  border-radius: var(--radius-full);
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.user-profile:hover {
  background: var(--bg-input-focus);
  border-color: var(--border-hover);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: rgba(99, 102, 241, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chevron {
  font-size: 0.8rem;
  color: var(--text-muted);
  transition: transform var(--transition-fast);
}

.user-chevron.open {
  transform: rotate(180deg);
}

/* Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 100;
  animation: fadeInUp 0.2s ease;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
}

.dropdown-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: rgba(99, 102, 241, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.dropdown-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.dropdown-email {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px var(--space-lg);
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-input);
  color: var(--text-primary);
}

.logout-item:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 49;
}

.content-area {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 72px;
  }

  .topbar {
    padding: var(--space-md);
  }

  .current-month {
    font-size: 0.9rem;
    min-width: 140px;
  }

  .user-name {
    display: none;
  }

  .user-profile {
    padding: 6px 10px;
  }
}
</style>
