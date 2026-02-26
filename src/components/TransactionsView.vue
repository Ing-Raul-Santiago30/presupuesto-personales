<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgetStore } from '../composables/useBudgetStore'

const store = useBudgetStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const editingId = ref<string | null>(null)
const filterType = ref<'all' | 'income' | 'expense'>('all')
const searchQuery = ref('')
const sortBy = ref<'date' | 'amount'>('date')
const sortDir = ref<'desc' | 'asc'>('desc')

// Form state
const form = ref({
  type: 'expense' as 'income' | 'expense',
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  recurring: false,
})

const filteredTransactions = computed(() => {
  let txs = [...store.transactions.value]

  if (filterType.value !== 'all') {
    txs = txs.filter(t => t.type === filterType.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    txs = txs.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    )
  }

  txs.sort((a, b) => {
    if (sortBy.value === 'date') {
      return sortDir.value === 'desc'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    return sortDir.value === 'desc' ? b.amount - a.amount : a.amount - b.amount
  })

  return txs
})

const availableCategories = computed(() => {
  return store.budgets.value.filter(b => b.type === form.value.type)
})

const totalFiltered = computed(() => {
  return filteredTransactions.value.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount
  }, 0)
})

function resetForm() {
  form.value = {
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false,
  }
}

function openAdd() {
  resetForm()
  showAddModal.value = true
}

function openEdit(id: string) {
  const tx = store.transactions.value.find(t => t.id === id)
  if (!tx) return
  editingId.value = id
  form.value = {
    type: tx.type,
    amount: String(tx.amount),
    category: tx.category,
    description: tx.description,
    date: tx.date,
    recurring: tx.recurring,
  }
  showEditModal.value = true
}

function handleAdd() {
  if (!form.value.amount || !form.value.category || !form.value.description) return
  store.addTransaction({
    type: form.value.type,
    amount: parseFloat(form.value.amount),
    category: form.value.category,
    description: form.value.description,
    date: form.value.date,
    recurring: form.value.recurring,
  })
  showAddModal.value = false
  resetForm()
}

function handleEdit() {
  if (!editingId.value || !form.value.amount || !form.value.category || !form.value.description) return
  store.updateTransaction(editingId.value, {
    type: form.value.type,
    amount: parseFloat(form.value.amount),
    category: form.value.category,
    description: form.value.description,
    date: form.value.date,
    recurring: form.value.recurring,
  })
  showEditModal.value = false
  editingId.value = null
  resetForm()
}

function handleDelete(id: string) {
  if (confirm('¿Estás seguro de eliminar esta transacción?')) {
    store.deleteTransaction(id)
  }
}

function toggleSort(field: 'date' | 'amount') {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = field
    sortDir.value = 'desc'
  }
}

function getCategoryIcon(catName: string): string {
  const cat = store.budgets.value.find(b => b.name === catName)
  return cat?.icon || '📦'
}
</script>

<template>
  <div class="transactions-view">
    <div class="view-header">
      <div>
        <h1 class="page-title">Transacciones</h1>
        <p class="page-subtitle">{{ store.getMonthName(store.currentMonth.value) }}</p>
      </div>
      <button class="btn btn-primary" @click="openAdd" id="add-transaction-btn">
        <span>＋</span> Nueva Transacción
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar glass-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar transacciones..."
          id="search-transactions"
        />
      </div>
      <div class="filter-tabs">
        <button
          class="filter-tab"
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >Todos</button>
        <button
          class="filter-tab"
          :class="{ active: filterType === 'income' }"
          @click="filterType = 'income'"
        >Ingresos</button>
        <button
          class="filter-tab"
          :class="{ active: filterType === 'expense' }"
          @click="filterType = 'expense'"
        >Gastos</button>
      </div>
      <div class="sort-controls">
        <button
          class="btn-icon"
          :class="{ 'sort-active': sortBy === 'date' }"
          @click="toggleSort('date')"
          title="Ordenar por fecha"
        >
          📅 {{ sortBy === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : '' }}
        </button>
        <button
          class="btn-icon"
          :class="{ 'sort-active': sortBy === 'amount' }"
          @click="toggleSort('amount')"
          title="Ordenar por monto"
        >
          💲 {{ sortBy === 'amount' ? (sortDir === 'desc' ? '↓' : '↑') : '' }}
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div class="tx-summary" v-if="filteredTransactions.length > 0">
      <span class="tx-count">{{ filteredTransactions.length }} transacciones</span>
      <span class="tx-total" :class="totalFiltered >= 0 ? 'positive' : 'negative'">
        Neto: {{ store.formatCurrency(Math.abs(totalFiltered)) }}
        {{ totalFiltered >= 0 ? '↗' : '↘' }}
      </span>
    </div>

    <!-- Transactions List -->
    <div class="tx-list" v-if="filteredTransactions.length > 0">
      <div
        v-for="tx in filteredTransactions"
        :key="tx.id"
        class="tx-item glass-card"
      >
        <div class="tx-type-indicator" :class="tx.type"></div>
        <div class="tx-icon">
          {{ getCategoryIcon(tx.category) }}
        </div>
        <div class="tx-details">
          <p class="tx-description">{{ tx.description }}</p>
          <p class="tx-meta">
            <span class="tx-category">{{ tx.category }}</span>
            <span class="tx-date">{{ new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
            <span class="badge badge-info" v-if="tx.recurring" style="font-size: 0.65rem;">🔄 Recurrente</span>
          </p>
        </div>
        <div class="tx-amount" :class="tx.type">
          {{ tx.type === 'income' ? '+' : '-' }}{{ store.formatCurrency(tx.amount) }}
        </div>
        <div class="tx-actions">
          <button class="btn-icon" @click="openEdit(tx.id)" title="Editar">✏️</button>
          <button class="btn-icon" @click="handleDelete(tx.id)" title="Eliminar">🗑️</button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="glass-card empty-state" v-else>
      <span class="empty-state-icon">📭</span>
      <p class="empty-state-text">No se encontraron transacciones</p>
      <button class="btn btn-primary" @click="openAdd" style="margin-top: 16px;">
        <span>＋</span> Agregar Primera Transacción
      </button>
    </div>

    <!-- Add Modal -->
    <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>➕ Nueva Transacción</h2>
          <button class="modal-close" @click="showAddModal = false">✕</button>
        </div>
        <form @submit.prevent="handleAdd" class="tx-form">
          <div class="form-group">
            <label>Tipo</label>
            <div class="type-toggle">
              <button
                type="button"
                class="type-btn"
                :class="{ active: form.type === 'expense', expense: form.type === 'expense' }"
                @click="form.type = 'expense'; form.category = ''"
              >💸 Gasto</button>
              <button
                type="button"
                class="type-btn"
                :class="{ active: form.type === 'income', income: form.type === 'income' }"
                @click="form.type = 'income'; form.category = ''"
              >💰 Ingreso</button>
            </div>
          </div>
          <div class="form-group">
            <label for="tx-amount">Monto</label>
            <input
              type="number"
              id="tx-amount"
              v-model="form.amount"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div class="form-group">
            <label for="tx-category">Categoría</label>
            <select id="tx-category" v-model="form.category" required>
              <option value="" disabled>Seleccionar categoría</option>
              <option v-for="cat in availableCategories" :key="cat.id" :value="cat.name">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="tx-description">Descripción</label>
            <input
              type="text"
              id="tx-description"
              v-model="form.description"
              placeholder="Descripción del movimiento"
              required
            />
          </div>
          <div class="form-group">
            <label for="tx-date">Fecha</label>
            <input type="date" id="tx-date" v-model="form.date" required />
          </div>
          <div class="form-group-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.recurring" />
              <span class="checkbox-custom"></span>
              Transacción recurrente
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-overlay" v-if="showEditModal" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ Editar Transacción</h2>
          <button class="modal-close" @click="showEditModal = false">✕</button>
        </div>
        <form @submit.prevent="handleEdit" class="tx-form">
          <div class="form-group">
            <label>Tipo</label>
            <div class="type-toggle">
              <button
                type="button"
                class="type-btn"
                :class="{ active: form.type === 'expense', expense: form.type === 'expense' }"
                @click="form.type = 'expense'; form.category = ''"
              >💸 Gasto</button>
              <button
                type="button"
                class="type-btn"
                :class="{ active: form.type === 'income', income: form.type === 'income' }"
                @click="form.type = 'income'; form.category = ''"
              >💰 Ingreso</button>
            </div>
          </div>
          <div class="form-group">
            <label for="edit-amount">Monto</label>
            <input type="number" id="edit-amount" v-model="form.amount" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label for="edit-category">Categoría</label>
            <select id="edit-category" v-model="form.category" required>
              <option value="" disabled>Seleccionar categoría</option>
              <option v-for="cat in availableCategories" :key="cat.id" :value="cat.name">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-description">Descripción</label>
            <input type="text" id="edit-description" v-model="form.description" required />
          </div>
          <div class="form-group">
            <label for="edit-date">Fecha</label>
            <input type="date" id="edit-date" v-model="form.date" required />
          </div>
          <div class="form-group-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.recurring" />
              <span class="checkbox-custom"></span>
              Transacción recurrente
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Actualizar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transactions-view {
  padding: var(--space-xl);
  max-width: 1000px;
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

/* Filters */
.filters-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 200px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  transition: all var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.search-box input {
  border: none;
  background: transparent;
  padding: 10px 0;
  box-shadow: none;
}

.search-box input:focus {
  box-shadow: none;
  border-color: transparent;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 3px;
}

.filter-tab {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab.active {
  background: var(--accent-primary);
  color: #fff;
}

.filter-tab:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-input-focus);
}

.sort-controls {
  display: flex;
  gap: 4px;
}

.sort-active {
  background: rgba(99, 102, 241, 0.15) !important;
  color: var(--accent-primary) !important;
  border-color: rgba(99, 102, 241, 0.3) !important;
}

/* Summary */
.tx-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-sm);
  margin-bottom: var(--space-md);
}

.tx-count {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.tx-total {
  font-size: 0.85rem;
  font-weight: 700;
}

.positive { color: var(--success); }
.negative { color: var(--danger); }

/* Transaction List */
.tx-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.tx-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  position: relative;
  overflow: hidden;
}

.tx-type-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.tx-type-indicator.income { background: var(--success); }
.tx-type-indicator.expense { background: var(--danger); }

.tx-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.tx-details {
  flex: 1;
  min-width: 0;
}

.tx-description {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.tx-category {
  font-size: 0.78rem;
  color: var(--text-accent);
  font-weight: 500;
}

.tx-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tx-amount {
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
}

.tx-amount.income { color: var(--success); }
.tx-amount.expense { color: var(--danger); }

.tx-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.tx-item:hover .tx-actions {
  opacity: 1;
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

.type-btn:hover {
  border-color: var(--border-hover);
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

.form-group-row {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

@media (max-width: 768px) {
  .transactions-view {
    padding: var(--space-md);
  }

  .view-header {
    flex-direction: column;
    gap: var(--space-md);
  }

  .filters-bar {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .tx-actions {
    opacity: 1;
  }

  .tx-item {
    flex-wrap: wrap;
  }
}
</style>
