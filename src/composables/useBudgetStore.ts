import { ref, computed, watch } from 'vue'
import { apiRequest } from '../services/api'
import type { Transaction, BudgetCategory } from '../types'

function getCurrentMonthKey(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Types for the summary from backend
interface MonthSummary {
    totalIncome: number
    totalExpenses: number
    balance: number
    savingsRate: number
    expensesByCategory: Array<{ category: string, amount: number, icon: string, color: string, percentage: number }>
    incomeByCategory: Array<{ category: string, amount: number, icon: string, color: string, percentage: number }>
    dailyExpenses: Array<{ day: string, amount: number }>
    budgetUtilization: Array<{ id: number, name: string, limit: number, spent: number, percentage: number, icon: string, color: string, remaining: number }>
}

// Global state
const currentMonth = ref(getCurrentMonthKey())
const transactions = ref<Transaction[]>([])
const budgets = ref<BudgetCategory[]>([])
const availableCategories = ref<string[]>([])
const summary = ref<MonthSummary | null>(null)
const currency = ref('$')
const isLoading = ref(false)

export function useBudgetStore() {

    async function fetchData() {
        if (isLoading.value) return
        isLoading.value = true
        try {
            const [txList, budgetList, summaryData, categoriesList] = await Promise.all([
                apiRequest<Transaction[]>(`/transactions?month=${currentMonth.value}`),
                apiRequest<BudgetCategory[]>(`/budgets?month=${currentMonth.value}`),
                apiRequest<MonthSummary>(`/reports/summary?month=${currentMonth.value}`),
                apiRequest<string[]>('/budgets/suggestions')
            ])

            transactions.value = txList
            budgets.value = budgetList
            summary.value = summaryData
            availableCategories.value = categoriesList
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            isLoading.value = false
        }
    }

    // Refetch when month changes
    watch(currentMonth, () => {
        fetchData()
    }, { immediate: true })

    const totalIncome = computed(() => summary.value?.totalIncome || 0)
    const totalExpenses = computed(() => summary.value?.totalExpenses || 0)
    const balance = computed(() => summary.value?.balance || 0)
    const savingsRate = computed(() => summary.value?.savingsRate || 0)

    const expensesByCategory = computed(() => {
        const map: Record<string, number> = {}
        summary.value?.expensesByCategory.forEach(item => {
            map[item.category] = item.amount
        })
        return map
    })

    const incomeByCategory = computed(() => {
        const map: Record<string, number> = {}
        summary.value?.incomeByCategory.forEach(item => {
            map[item.category] = item.amount
        })
        return map
    })

    const dailyExpenses = computed(() => {
        const map: Record<string, number> = {}
        summary.value?.dailyExpenses.forEach(item => {
            map[item.day] = item.amount
        })
        return map
    })

    const recentTransactions = computed(() => {
        return [...transactions.value]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
    })

    const budgetUtilization = computed(() => {
        return summary.value?.budgetUtilization || []
    })

    async function addTransaction(tx: Omit<Transaction, 'id'>) {
        try {
            await apiRequest('/transactions', {
                method: 'POST',
                body: JSON.stringify(tx)
            })
            await fetchData() // Refresh all data
        } catch (err) {
            console.error('Error adding transaction:', err)
            throw err
        }
    }

    async function updateTransaction(id: string | number, updates: Partial<Transaction>) {
        try {
            await apiRequest(`/transactions/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            })
            await fetchData()
        } catch (err) {
            console.error('Error updating transaction:', err)
            throw err
        }
    }

    async function deleteTransaction(id: string | number) {
        try {
            await apiRequest(`/transactions/${id}`, {
                method: 'DELETE'
            })
            await fetchData()
        } catch (err) {
            console.error('Error deleting transaction:', err)
            throw err
        }
    }

    async function updateBudgetLimit(categoryId: string | number, limit: number) {
        try {
            await apiRequest(`/budgets/${categoryId}/limit`, {
                method: 'PATCH',
                body: JSON.stringify({ limit })
            })
            await fetchData()
        } catch (err) {
            console.error('Error updating budget:', err)
            throw err
        }
    }

    async function addCategory(cat: Omit<BudgetCategory, 'id'>) {
        try {
            await apiRequest('/budgets', {
                method: 'POST',
                body: JSON.stringify({ ...cat, monthKey: currentMonth.value })
            })
            await fetchData()
        } catch (err) {
            console.error('Error adding category:', err)
            throw err
        }
    }

    async function deleteCategory(id: string | number) {
        try {
            await apiRequest(`/budgets/${id}`, {
                method: 'DELETE'
            })
            await fetchData()
        } catch (err) {
            console.error('Error deleting category:', err)
            throw err
        }
    }

    function setMonth(monthKey: string) {
        currentMonth.value = monthKey
    }

    function getMonthName(monthKey: string): string {
        const [yearStr, monthStr] = monthKey.split('-')
        const year = parseInt(yearStr || '0')
        const month = parseInt(monthStr || '0')
        const date = new Date(year, month - 1)
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    }

    function formatCurrency(amount: number): string {
        return `${currency.value}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return {
        currentMonth,
        currency,
        isLoading,
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
        availableCategories,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgetLimit,
        addCategory,
        deleteCategory,
        setMonth,
        getMonthName,
        formatCurrency,
        fetchData
    }
}
