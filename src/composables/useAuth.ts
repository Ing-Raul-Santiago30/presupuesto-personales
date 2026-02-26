import { ref, computed } from 'vue'

const USERS_KEY = 'budgetpro_users'
const SESSION_KEY = 'budgetpro_session'

export interface User {
    id: string
    name: string
    email: string
    password: string
    avatar: string
    createdAt: string
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function loadUsers(): User[] {
    try {
        const raw = localStorage.getItem(USERS_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return []
}

function saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadSession(): User | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return null
}

function saveSession(user: User | null) {
    if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
        localStorage.removeItem(SESSION_KEY)
    }
}

// Global reactive state
const currentUser = ref<User | null>(loadSession())
const isAuthenticated = computed(() => currentUser.value !== null)

// Avatar options
const avatarOptions = ['🧑‍💼', '👩‍💼', '🧑‍💻', '👩‍💻', '🧑‍🎨', '👩‍🎨', '🦸', '🦸‍♀️', '🧙', '🧙‍♀️', '🐱', '🐶']

export function useAuth() {
    function register(name: string, email: string, password: string, avatar: string): { success: boolean; error?: string } {
        const users = loadUsers()

        // Check if email already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'Este correo ya está registrado' }
        }

        // Validate
        if (!name.trim()) return { success: false, error: 'El nombre es requerido' }
        if (!email.trim()) return { success: false, error: 'El correo es requerido' }
        if (password.length < 4) return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' }

        const newUser: User = {
            id: generateId(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            avatar: avatar || '🧑‍💼',
            createdAt: new Date().toISOString(),
        }

        users.push(newUser)
        saveUsers(users)
        currentUser.value = newUser
        saveSession(newUser)

        return { success: true }
    }

    function login(email: string, password: string): { success: boolean; error?: string } {
        const users = loadUsers()

        if (!email.trim()) return { success: false, error: 'El correo es requerido' }
        if (!password) return { success: false, error: 'La contraseña es requerida' }

        const user = users.find(
            u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
        )

        if (!user) {
            return { success: false, error: 'Correo o contraseña incorrectos' }
        }

        currentUser.value = user
        saveSession(user)
        return { success: true }
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
