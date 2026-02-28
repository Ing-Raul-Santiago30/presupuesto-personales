import { ref, computed } from 'vue'
import { apiRequest } from '../services/api'

const SESSION_KEY = 'budgetpro_session'
const TOKEN_KEY = 'budgetpro_token'

export interface User {
    id: number
    name: string
    email: string
    avatar: string
    currency: string
    createdAt: string
}

interface AuthResponse {
    success: boolean
    error?: string
    token?: string
    user?: User
}

function loadSession(): User | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return null
}

function saveSession(user: User | null, token?: string) {
    if (user && token) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))
        localStorage.setItem(TOKEN_KEY, token)
    } else {
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(TOKEN_KEY)
    }
}

// Global reactive state
const currentUser = ref<User | null>(loadSession())
const isAuthenticated = computed(() => currentUser.value !== null)

// Avatar options
const avatarOptions = ['🧑‍💼', '👩‍💼', '🧑‍💻', '👩‍💻', '🧑‍🎨', '👩‍🎨', '🦸', '🦸‍♀️', '🧙', '🧙‍♀️', '🐱', '🐶']

export function useAuth() {
    async function register(name: string, email: string, password: string, avatar: string): Promise<{ success: boolean; error?: string }> {
        try {
            const result = await apiRequest<AuthResponse>('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, avatar })
            })

            if (result.success && result.user && result.token) {
                currentUser.value = result.user
                saveSession(result.user, result.token)
                return { success: true }
            }
            return { success: false, error: result.error || 'Error desconocido' }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    }

    async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const result = await apiRequest<AuthResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            })

            if (result.success && result.user && result.token) {
                currentUser.value = result.user
                saveSession(result.user, result.token)
                return { success: true }
            }
            return { success: false, error: result.error || 'Error desconocido' }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    }

    function logout() {
        currentUser.value = null
        saveSession(null)
    }

    return {
        currentUser,
        isAuthenticated,
        avatarOptions,
        register,
        login,
        logout,
    }
}
