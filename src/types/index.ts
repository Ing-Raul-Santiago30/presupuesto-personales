export interface Transaction {
  id: string | number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  recurring: boolean
}

export interface BudgetCategory {
  id: string | number
  name: string
  icon: string
  color: string
  limit: number
  type: 'income' | 'expense'
}

export interface MonthData {
  key: string // format: YYYY-MM
  transactions: Transaction[]
  budgets: BudgetCategory[]
}

export interface AppState {
  currentMonth: string
  transactions: Transaction[]
  budgets: BudgetCategory[]
  currency: string
}

export type ViewMode = 'dashboard' | 'transactions' | 'budgets' | 'reports'
