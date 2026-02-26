<script setup lang="ts">
import { ref } from 'vue'
import type { ViewMode } from '../types'

const props = defineProps<{
  activeView: ViewMode
}>()

const emit = defineEmits<{
  (e: 'navigate', view: ViewMode): void
}>()

const isCollapsed = ref(false)

const navItems: { view: ViewMode; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '📊', label: 'Dashboard' },
  { view: 'transactions', icon: '💳', label: 'Transacciones' },
  { view: 'budgets', icon: '🎯', label: 'Presupuestos' },
  { view: 'reports', icon: '📈', label: 'Reportes' },
]
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="logo" v-show="!isCollapsed">
        <span class="logo-icon">💎</span>
        <h1 class="logo-text">BudgetPro</h1>
      </div>
      <button class="toggle-btn" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? 'Expandir' : 'Colapsar'">
        <span class="toggle-icon" :class="{ rotated: isCollapsed }">‹</span>
      </button>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.view"
        class="nav-item"
        :class="{ active: activeView === item.view }"
        @click="emit('navigate', item.view)"
        :title="isCollapsed ? item.label : ''"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" v-show="!isCollapsed">{{ item.label }}</span>
        <span class="active-indicator" v-if="activeView === item.view"></span>
      </button>
    </nav>

    <div class="sidebar-footer" v-show="!isCollapsed">
      <div class="sidebar-version">
        <span class="version-dot"></span>
        v1.0.0
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100vh;
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-slow);
  z-index: 100;
}

.sidebar.collapsed {
  width: 72px;
  min-width: 72px;
}

.sidebar-header {
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  overflow: hidden;
}

.logo-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: var(--bg-input-focus);
  color: var(--text-primary);
}

.toggle-icon {
  font-size: 1.2rem;
  transition: transform var(--transition-base);
  line-height: 1;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: var(--font-family);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-input);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.12);
  color: var(--accent-primary);
  font-weight: 600;
}

.nav-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--accent-gradient);
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
}

.sidebar-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.sidebar-version {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.version-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse-glow 2s infinite;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    width: 72px;
    min-width: 72px;
  }

  .logo, .nav-label, .sidebar-footer {
    display: none !important;
  }
}
</style>
