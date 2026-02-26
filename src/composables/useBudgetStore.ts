import { ref, computed, watch } from 'vue'
import type { Transaction, BudgetCategory } from '../types'

const STORAGE_KEY = 'budgetpro_data'

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function getCurrentMonthKey(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return JSON.parse(raw)
    } catch {
        // ignore
    }
    return null
}

function saveToStorage(data: any) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const defaultCategories: BudgetCategory[] = [
    { id: 'cat-1', name: 'Salario', icon: '💰', color: '#10b981', limit: 0, type: 'income' },
    { id: 'cat-2', name: 'Freelance', icon: '💻', color: '#06b6d4', limit: 0, type: 'income' },
    { id: 'cat-3', name: 'Inversiones', icon: '📈', color: '#8b5cf6', limit: 0, type: 'income' },
    { id: 'cat-4', name: 'Otros Ingresos', icon: '🎁', color: '#f59e0b', limit: 0, type: 'income' },
    { id: 'cat-5', name: 'Alimentación', icon: '🛒', color: '#ef4444', limit: 0, type: 'expense' },
    { id: 'cat-6', name: 'Transporte', icon: '🚗', color: '#f97316', limit: 0, type: 'expense' },
    { id: 'cat-7', name: 'Vivienda', icon: '🏠', color: '#3b82f6', limit: 0, type: 'expense' },
    { id: 'cat-8', name: 'Servicios', icon: '💡', color: '#eab308', limit: 0, type: 'expense' },
    { id: 'cat-9', name: 'Entretenimiento', icon: '🎬', color: '#ec4899', limit: 0, type: 'expense' },
    { id: 'cat-10', name: 'Salud', icon: '🏥', color: '#14b8a6', limit: 0, type: 'expense' },
    { id: 'cat-11', name: 'Educación', icon: '📚', color: '#6366f1', limit: 0, type: 'expense' },
    { id: 'cat-12', name: 'Ropa', icon: '👕', color: '#a855f7', limit: 0, type: 'expense' },
    { id: 'cat-13', name: 'Ahorro', icon: '🏦', color: '#22c55e', limit: 0, type: 'expense' },
    { id: 'cat-14', name: 'Deudas', icon: '📄', color: '#dc2626', limit: 0, type: 'expense' },
    { id: 'cat-15', name: 'Otros Gastos', icon: '📦', color: '#78716c', limit: 0, type: 'expense' },
]

// Global state
const currentMonth = ref(getCurrentMonthKey())
const allTransactions = ref<Record<string, Transaction[]>>({})
const allBudgets = ref<Record<string, BudgetCategory[]>>({})
const currency = ref('$')

// Initialize from storage
const stored = loadFromStorage()
if (stored) {
    if (stored.allTransactions) allTransactions.value = stored.allTransactions
    if (stored.allBudgets) allBudgets.value = stored.allBudgets
    if (stored.currency) currency.value = stored.currency
}

// Ensure current month has budgets
if (!allBudgets.value[currentMonth.value]) {
    allBudgets.value[currentMonth.value] = JSON.parse(JSON.stringify(defaultCategories))
}

// Auto-save
watch([allTransactions, allBudgets, currency], () => {
    saveToStorage({
        allTransactions: allTransactions.value,
        allBudgets: allBudgets.value,
        currency: currency.value,
    })
}, { deep: true })

export function useBudgetStore() {
    const transactions = computed(() => {
        return allTransactions.value[currentMonth.value] || []
    })

    const budgets = computed(() => {
        if (!allBudgets.value[currentMonth.value]) {
            allBudgets.value[currentMonth.value] = JSON.parse(JSON.stringify(defaultCategories))
        }
        return allBudgets.value[currentMonth.value]
    })

    const totalIncome = computed(() => {
        return transactions.value
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)
    })

    const totalExpenses = computed(() => {
        return transactions.value
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
    })

    const balance = computed(() => totalIncome.value - totalExpenses.value)

    const savingsRate = computed(() => {
        if (totalIncome.value === 0) return 0
        return ((totalIncome.value - totalExpenses.value) / totalIncome.value) * 100
    })

    const expensesByCategory = computed(() => {
        const map: Record<string, number> = {}
        transactions.value
            .filter(t => t.type === 'expense')
            .forEach(t => {
                map[t.category] = (map[t.category] || 0) + t.amount
            })
        return map
    })

    const incomeByCategory = computed(() => {
        const map: Record<string, number> = {}
        transactions.value
            .filter(t => t.type === 'income')
            .forEach(t => {
                map[t.category] = (map[t.category] || 0) + t.amount
            })
        return map
    })

    const dailyExpenses = computed(() => {
        const map: Record<string, number> = {}
        transactions.value
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const day = t.date.split('-')[2]
                map[day] = (map[day] || 0) + t.amount
            })
        return map
    })

    const recentTransactions = computed(() => {
        return [...transactions.value]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
    })

    const budgetUtilization = computed(() => {
        return budgets.value
            .filter(b => b.type === 'expense' && b.limit > 0)
            .map(b => {
                const spent = expensesByCategory.value[b.name] || 0
                return {
                    ...b,
                    spent,
                    percentage: (spent / b.limit) * 100,
                    remaining: b.limit - spent,
                }
            })
    })

    function addTransaction(tx: Omit<Transaction, 'id'>) {
        const id = generateId()
        if (!allTransactions.value[currentMonth.value]) {
            allTransactions.value[currentMonth.value] = []
        }
        allTransactions.value[currentMonth.value].push({ ...tx, id })
    }

    function updateTransaction(id: string, updates: Partial<Transaction>) {
        const txs = allTransactions.value[currentMonth.value]
        if (!txs) return
        const idx = txs.findIndex(t => t.id === id)
        if (idx !== -1) {
            txs[idx] = { ...txs[idx], ...updates }
        }
    }

    function deleteTransaction(id: string) {
        const txs = allTransactions.value[currentMonth.value]
        if (!txs) return
        const idx = txs.findIndex(t => t.id === id)
        if (idx !== -1) {
            txs.splice(idx, 1)
        }
    }

    function updateBudgetLimit(categoryId: string, limit: number) {
        const cats = allBudgets.value[currentMonth.value]
        if (!cats) return
        const idx = cats.findIndex(c => c.id === categoryId)
        if (idx !== -1) {
            cats[idx].limit = limit
        }
    }

    function addCategory(cat: Omit<BudgetCategory, 'id'>) {
        const id = generateId()
        if (!allBudgets.value[currentMonth.value]) {
            allBudgets.value[currentMonth.value] = []
        }
        allBudgets.value[currentMonth.value].push({ ...cat, id })
    }

    function deleteCategory(id: string) {
        const cats = allBudgets.value[currentMonth.value]
        if (!cats) return
        const idx = cats.findIndex(c => c.id === id)
        if (idx !== -1) {
            cats.splice(idx, 1)
        }
    }

    function setMonth(monthKey: string) {
        currentMonth.value = monthKey
        if (!allBudgets.value[monthKey]) {
            // Copy budgets from previous month or use defaults
            const months = Object.keys(allBudgets.value).sort()
            const prevMonth = months.length > 0 ? months[months.length - 1] : null
            if (prevMonth && allBudgets.value[prevMonth]) {
                allBudgets.value[monthKey] = JSON.parse(JSON.stringify(allBudgets.value[prevMonth]))
            } else {
                allBudgets.value[monthKey] = JSON.parse(JSON.stringify(defaultCategories))
            }
        }
    }

    function getMonthName(monthKey: string): string {
        const [year, month] = monthKey.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    }

    function formatCurrency(amount: number): string {
        return `${currency.value}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return {
        currentMonth,
        currency,
        transactions,
        budgets,
        totalIncome,
        totalExpenses,
        balance,
        savingsRate,
        expensesByCategory,
        incomeByCategory,
        dailyExpenses,
        recentTransactions,
        budgetUtilization,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgetLimit,
        addCategory,
        deleteCategory,
        setMonth,
        getMonthName,
        formatCurrency,
    }
}
