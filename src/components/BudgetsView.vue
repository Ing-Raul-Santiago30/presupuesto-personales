<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgetStore } from '../composables/useBudgetStore'

const store = useBudgetStore()

const showAddCategory = ref(false)
const editingBudgetId = ref<string | null>(null)
const editLimit = ref('')

const newCategory = ref({
  name: '',
  icon: '📦',
  color: '#6366f1',
  limit: '',
  type: 'expense' as 'income' | 'expense',
})

const expenseCategories = computed(() => {
  return store.budgets.value.filter(b => b.type === 'expense')
})

const incomeCategories = computed(() => {
  return store.budgets.value.filter(b => b.type === 'income')
})

const totalBudgeted = computed(() => {
  return expenseCategories.value.reduce((sum, b) => sum + b.limit, 0)
})

const totalSpent = computed(() => {
  return store.totalExpenses.value
})

const overallPercentage = computed(() => {
  if (totalBudgeted.value === 0) return 0
  return (totalSpent.value / totalBudgeted.value) * 100
})

function getCategorySpent(catName: string): number {
  return store.expensesByCategory.value[catName] || 0
}

function getCategoryPercentage(catName: string, limit: number): number {
  if (limit === 0) return 0
  return (getCategorySpent(catName) / limit) * 100
}

function startEditLimit(id: string, currentLimit: number) {
  editingBudgetId.value = id
  editLimit.value = String(currentLimit)
}

function saveLimit() {
  if (editingBudgetId.value) {
    store.updateBudgetLimit(editingBudgetId.value, parseFloat(editLimit.value) || 0)
    editingBudgetId.value = null
    editLimit.value = ''
  }
}

function cancelEdit() {
  editingBudgetId.value = null
  editLimit.value = ''
}

function handleAddCategory() {
  if (!newCategory.value.name) return
  store.addCategory({
    name: newCategory.value.name,
    icon: newCategory.value.icon,
    color: newCategory.value.color,
    limit: parseFloat(newCategory.value.limit) || 0,
    type: newCategory.value.type,
  })
  newCategory.value = { name: '', icon: '📦', color: '#6366f1', limit: '', type: 'expense' }
  showAddCategory.value = false
}

function handleDeleteCategory(id: string) {
  if (confirm('¿Estás seguro de eliminar esta categoría?')) {
    store.deleteCategory(id)
  }
}

const iconOptions = ['🛒', '🚗', '🏠', '💡', '🎬', '🏥', '📚', '👕', '🏦', '📄', '📦', '🍕', '✈️', '🏋️', '🎮', '💇', '🐾', '🎵', '📱', '💰', '💻', '📈', '🎁', '⚽', '🍔', '☕']
</script>

<template>
  <div class="budgets-view">
    <div class="view-header">
      <div>
        <h1 class="page-title">Presupuestos</h1>
        <p class="page-subtitle">{{ store.getMonthName(store.currentMonth.value) }}</p>
      </div>
      <button class="btn btn-primary" @click="showAddCategory = true" id="add-category-btn">
        <span>＋</span> Nueva Categoría
      </button>
    </div>

    <!-- Overall Summary -->
    <div class="overall-summary glass-card">
      <div class="overall-info">
        <div>
          <p class="overall-label">Presupuesto Total</p>
          <p class="overall-value">{{ store.formatCurrency(totalBudgeted) }}</p>
        </div>
        <div>
          <p class="overall-label">Gastado</p>
          <p class="overall-value expense-color">{{ store.formatCurrency(totalSpent) }}</p>
        </div>
        <div>
          <p class="overall-label">Disponible</p>
          <p class="overall-value" :class="totalBudgeted - totalSpent >= 0 ? 'positive' : 'negative'">
            {{ store.formatCurrency(totalBudgeted - totalSpent) }}
          </p>
        </div>
      </div>
      <div class="overall-progress">
        <div class="progress-labels">
          <span>Uso total</span>
          <span :class="overallPercentage > 100 ? 'negative' : ''">{{ overallPercentage.toFixed(1) }}%</span>
        </div>
        <div class="progress-bar" style="height: 12px;">
          <div
            class="progress-fill"
            :class="{
              danger: overallPercentage >= 100,
              warning: overallPercentage >= 80 && overallPercentage < 100,
              success: overallPercentage < 80,
            }"
            :style="{ width: Math.min(overallPercentage, 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Expense Categories -->
    <div class="section">
      <h2 class="section-title">💸 Categorías de Gastos</h2>
      <div class="budget-grid">
        <div
          v-for="cat in expenseCategories"
          :key="cat.id"
          class="budget-card glass-card"
        >
          <div class="budget-card-header">
            <div class="budget-card-info">
              <span class="budget-card-icon" :style="{ background: cat.color + '20' }">{{ cat.icon }}</span>
              <div>
                <p class="budget-card-name">{{ cat.name }}</p>
                <p class="budget-card-spent">
                  Gastado: {{ store.formatCurrency(getCategorySpent(cat.name)) }}
                </p>
              </div>
            </div>
            <button class="btn-icon btn-sm" @click="handleDeleteCategory(cat.id)" title="Eliminar">🗑️</button>
          </div>

          <!-- Limit editing -->
          <div class="budget-limit-section">
            <template v-if="editingBudgetId === cat.id">
              <div class="edit-limit-row">
                <input
                  type="number"
                  v-model="editLimit"
                  class="limit-input"
                  @keyup.enter="saveLimit"
                  @keyup.escape="cancelEdit"
                  placeholder="Límite"
                  min="0"
                  step="0.01"
                />
                <button class="btn btn-success btn-sm" @click="saveLimit">✓</button>
                <button class="btn btn-secondary btn-sm" @click="cancelEdit">✕</button>
              </div>
            </template>
            <template v-else>
              <div class="limit-display" @click="startEditLimit(cat.id, cat.limit)">
                <span class="limit-label">Límite:</span>
                <span class="limit-value">{{ cat.limit > 0 ? store.formatCurrency(cat.limit) : 'Sin definir' }}</span>
                <span class="edit-hint">✏️</span>
              </div>
            </template>
          </div>

          <!-- Progress -->
          <template v-if="cat.limit > 0">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="{
                  danger: getCategoryPercentage(cat.name, cat.limit) >= 100,
                  warning: getCategoryPercentage(cat.name, cat.limit) >= 80 && getCategoryPercentage(cat.name, cat.limit) < 100,
                  success: getCategoryPercentage(cat.name, cat.limit) < 80,
                }"
                :style="{ width: Math.min(getCategoryPercentage(cat.name, cat.limit), 100) + '%' }"
              ></div>
            </div>
            <div class="budget-card-footer">
              <span class="budget-pct" :class="{
                'pct-danger': getCategoryPercentage(cat.name, cat.limit) >= 100,
                'pct-warning': getCategoryPercentage(cat.name, cat.limit) >= 80 && getCategoryPercentage(cat.name, cat.limit) < 100,
              }">
                {{ getCategoryPercentage(cat.name, cat.limit).toFixed(0) }}%
              </span>
              <span class="budget-remaining">
                Disponible: {{ store.formatCurrency(cat.limit - getCategorySpent(cat.name)) }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Income Categories -->
    <div class="section">
      <h2 class="section-title">💰 Categorías de Ingresos</h2>
      <div class="budget-grid">
        <div
          v-for="cat in incomeCategories"
          :key="cat.id"
          class="budget-card glass-card"
        >
          <div class="budget-card-header">
            <div class="budget-card-info">
              <span class="budget-card-icon" :style="{ background: cat.color + '20' }">{{ cat.icon }}</span>
              <div>
                <p class="budget-card-name">{{ cat.name }}</p>
                <p class="budget-card-earned">
                  Recibido: {{ store.formatCurrency(store.incomeByCategory.value[cat.name] || 0) }}
                </p>
              </div>
            </div>
            <button class="btn-icon btn-sm" @click="handleDeleteCategory(cat.id)" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Category Modal -->
    <div class="modal-overlay" v-if="showAddCategory" @click.self="showAddCategory = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>➕ Nueva Categoría</h2>
          <button class="modal-close" @click="showAddCategory = false">✕</button>
        </div>
        <form @submit.prevent="handleAddCategory" class="tx-form">
          <div class="form-group">
            <label>Tipo</label>
            <div class="type-toggle">
              <button
                type="button"
                class="type-btn"
                :class="{ active: newCategory.type === 'expense', expense: newCategory.type === 'expense' }"
                @click="newCategory.type = 'expense'"
              >💸 Gasto</button>
              <button
                type="button"
                class="type-btn"
                :class="{ active: newCategory.type === 'income', income: newCategory.type === 'income' }"
                @click="newCategory.type = 'income'"
              >💰 Ingreso</button>
            </div>
          </div>
          <div class="form-group">
            <label for="cat-name">Nombre</label>
            <input type="text" id="cat-name" v-model="newCategory.name" placeholder="Nombre de la categoría" required />
          </div>
          <div class="form-group">
            <label>Ícono</label>
            <div class="icon-grid">
              <button
                v-for="icon in iconOptions"
                :key="icon"
                type="button"
                class="icon-option"
                :class="{ selected: newCategory.icon === icon }"
                @click="newCategory.icon = icon"
              >{{ icon }}</button>
            </div>
          </div>
          <div class="form-group">
            <label for="cat-color">Color</label>
            <div class="color-input-wrapper">
              <input type="color" id="cat-color" v-model="newCategory.color" />
              <span class="color-preview" :style="{ background: newCategory.color }"></span>
              <span>{{ newCategory.color }}</span>
            </div>
          </div>
          <div class="form-group" v-if="newCategory.type === 'expense'">
            <label for="cat-limit">Límite Mensual</label>
            <input type="number" id="cat-limit" v-model="newCategory.limit" placeholder="0.00" step="0.01" min="0" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showAddCategory = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Categoría</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.budgets-view {
  padding: var(--space-xl);
  max-width: 1100px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

/* Overall Summary */
.overall-summary {
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.overall-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.overall-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.overall-value {
  font-size: 1.4rem;
  font-weight: 800;
}

.expense-color { color: var(--danger); }
.positive { color: var(--success); }
.negative { color: var(--danger); }

.overall-progress {
  margin-top: var(--space-sm);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

/* Section */
.section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: var(--space-md);
}

/* Budget Grid */
.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}

.budget-card {
  padding: var(--space-md);
}

.budget-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.budget-card-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.budget-card-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.budget-card-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.budget-card-spent,
.budget-card-earned {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* Limit Section */
.budget-limit-section {
  margin-bottom: var(--space-sm);
}

.limit-display {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.85rem;
}

.limit-display:hover {
  background: var(--bg-input-focus);
}

.limit-label {
  color: var(--text-muted);
  font-weight: 500;
}

.limit-value {
  font-weight: 700;
  flex: 1;
}

.edit-hint {
  opacity: 0;
  transition: opacity var(--transition-fast);
  font-size: 0.8rem;
}

.limit-display:hover .edit-hint {
  opacity: 1;
}

.edit-limit-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.limit-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 0.85rem;
}

/* Footer */
.budget-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 0.78rem;
}

.budget-pct {
  font-weight: 700;
  color: var(--text-secondary);
}

.pct-danger { color: var(--danger); }
.pct-warning { color: var(--warning); }

.budget-remaining {
  color: var(--text-muted);
}

/* Icon Grid */
.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.icon-option:hover {
  border-color: var(--border-hover);
  background: var(--bg-input-focus);
}

.icon-option.selected {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.15);
  box-shadow: 0 0 10px var(--accent-glow);
}

/* Color Input */
.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.color-input-wrapper input[type="color"] {
  width: 40px;
  height: 40px;
  padding: 2px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border-color);
}

/* Form */
.tx-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.type-toggle {
  display: flex;
  gap: 8px;
}

.type-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.type-btn.active.expense {
  border-color: var(--danger);
  background: var(--danger-bg);
  color: var(--danger);
}

.type-btn.active.income {
  border-color: var(--success);
  background: var(--success-bg);
  color: var(--success);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

@media (max-width: 768px) {
  .budgets-view {
    padding: var(--space-md);
  }

  .view-header {
    flex-direction: column;
    gap: var(--space-md);
  }

  .overall-info {
    grid-template-columns: 1fr;
  }

  .budget-grid {
    grid-template-columns: 1fr;
  }
}
</style>
