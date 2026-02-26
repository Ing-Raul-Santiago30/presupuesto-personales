<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits<{
  (e: 'authenticated'): void
}>()

const auth = useAuth()

const mode = ref<'login' | 'register'>('login')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const shakeError = ref(false)

// Login form
const loginForm = ref({
  email: '',
  password: '',
})

// Register form
const registerForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatar: '🧑‍💼',
})

const passwordStrength = computed(() => {
  const pwd = registerForm.value.password
  if (!pwd) return { level: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 4) score++
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 1) return { level: 1, label: 'Débil', color: '#ef4444' }
  if (score <= 2) return { level: 2, label: 'Regular', color: '#f59e0b' }
  if (score <= 3) return { level: 3, label: 'Buena', color: '#3b82f6' }
  return { level: 4, label: 'Fuerte', color: '#10b981' }
})

function triggerShake() {
  shakeError.value = true
  setTimeout(() => { shakeError.value = false }, 600)
}

async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  // Simulate small delay for UX
  await new Promise(r => setTimeout(r, 600))

  const result = auth.login(loginForm.value.email, loginForm.value.password)
  isLoading.value = false

  if (!result.success) {
    errorMessage.value = result.error || 'Error al iniciar sesión'
    triggerShake()
    return
  }

  emit('authenticated')
}

async function handleRegister() {
  errorMessage.value = ''

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = 'Las contraseñas no coinciden'
    triggerShake()
    return
  }

  isLoading.value = true
  await new Promise(r => setTimeout(r, 600))

  const result = auth.register(
    registerForm.value.name,
    registerForm.value.email,
    registerForm.value.password,
    registerForm.value.avatar,
  )
  isLoading.value = false

  if (!result.success) {
    errorMessage.value = result.error || 'Error al registrarse'
    triggerShake()
    return
  }

  emit('authenticated')
}

function switchToRegister() {
  mode.value = 'register'
  errorMessage.value = ''
  successMessage.value = ''
}

function switchToLogin() {
  mode.value = 'login'
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<template>
  <div class="login-page">
    <!-- Background decoration -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>
    <div class="floating-shapes">
      <div class="shape shape-1">💰</div>
      <div class="shape shape-2">📊</div>
      <div class="shape shape-3">💳</div>
      <div class="shape shape-4">🎯</div>
      <div class="shape shape-5">📈</div>
    </div>

    <div class="login-container" :class="{ shake: shakeError }">
      <!-- Logo & Header -->
      <div class="login-header">
        <div class="logo-container">
          <span class="logo-gem">💎</span>
        </div>
        <h1 class="login-title">BudgetPro</h1>
        <p class="login-subtitle">
          {{ mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta' }}
        </p>
      </div>

      <!-- Error Message -->
      <div class="error-banner" v-if="errorMessage">
        <span class="error-icon">⚠️</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Success Message -->
      <div class="success-banner" v-if="successMessage">
        <span class="success-icon">✅</span>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="login-email">Correo electrónico</label>
          <div class="input-wrapper">
            <span class="input-icon">📧</span>
            <input
              type="email"
              id="login-email"
              v-model="loginForm.email"
              placeholder="tu@correo.com"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="login-password"
              v-model="loginForm.password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading" id="login-submit-btn">
          <span class="btn-spinner" v-if="isLoading"></span>
          <span v-else>Iniciar Sesión</span>
        </button>

        <div class="auth-switch">
          <span>¿No tienes cuenta?</span>
          <button type="button" class="link-btn" @click="switchToRegister">Registrarse</button>
        </div>
      </form>

      <!-- Register Form -->
      <form v-if="mode === 'register'" @submit.prevent="handleRegister" class="auth-form">
        <!-- Avatar Picker -->
        <div class="form-group">
          <label>Elige tu avatar</label>
          <div class="avatar-picker">
            <button
              v-for="av in auth.avatarOptions"
              :key="av"
              type="button"
              class="avatar-option"
              :class="{ selected: registerForm.avatar === av }"
              @click="registerForm.avatar = av"
            >{{ av }}</button>
          </div>
        </div>

        <div class="form-group">
          <label for="register-name">Nombre completo</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              type="text"
              id="register-name"
              v-model="registerForm.name"
              placeholder="Tu nombre"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="register-email">Correo electrónico</label>
          <div class="input-wrapper">
            <span class="input-icon">📧</span>
            <input
              type="email"
              id="register-email"
              v-model="registerForm.email"
              placeholder="tu@correo.com"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="register-password">Contraseña</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="register-password"
              v-model="registerForm.password"
              placeholder="Mínimo 4 caracteres"
              required
              minlength="4"
              autocomplete="new-password"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <!-- Password Strength -->
          <div class="password-strength" v-if="registerForm.password">
            <div class="strength-bars">
              <div class="strength-bar" v-for="i in 4" :key="i"
                :class="{ active: passwordStrength.level >= i }"
                :style="{ background: passwordStrength.level >= i ? passwordStrength.color : '' }"
              ></div>
            </div>
            <span class="strength-label" :style="{ color: passwordStrength.color }">
              {{ passwordStrength.label }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="register-confirm">Confirmar contraseña</label>
          <div class="input-wrapper">
            <span class="input-icon">🔐</span>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="register-confirm"
              v-model="registerForm.confirmPassword"
              placeholder="Repite la contraseña"
              required
              minlength="4"
              autocomplete="new-password"
            />
          </div>
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading" id="register-submit-btn">
          <span class="btn-spinner" v-if="isLoading"></span>
          <span v-else>Crear Cuenta</span>
        </button>

        <div class="auth-switch">
          <span>¿Ya tienes cuenta?</span>
          <button type="button" class="link-btn" @click="switchToLogin">Iniciar Sesión</button>
        </div>
      </form>

      <!-- Footer -->
      <div class="login-footer">
        <p>Controla tus finanzas de forma inteligente ✨</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
  padding: var(--space-md);
}

/* Background Orbs */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  pointer-events: none;
}

.bg-orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%);
  top: -150px;
  right: -100px;
  animation: float-orb 8s ease-in-out infinite;
}

.bg-orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 70%);
  bottom: -100px;
  left: -100px;
  animation: float-orb 10s ease-in-out infinite reverse;
}

.bg-orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float-orb 12s ease-in-out infinite;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -20px); }
  66% { transform: translate(-20px, 30px); }
}

/* Floating Shapes */
.floating-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  font-size: 2rem;
  opacity: 0.12;
  animation: float-shape 6s ease-in-out infinite;
}

.shape-1 { top: 10%; left: 10%; animation-delay: 0s; }
.shape-2 { top: 20%; right: 15%; animation-delay: 1s; }
.shape-3 { bottom: 15%; left: 20%; animation-delay: 2s; }
.shape-4 { bottom: 25%; right: 10%; animation-delay: 3s; }
.shape-5 { top: 50%; left: 5%; animation-delay: 4s; }

@keyframes float-shape {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

/* Container */
.login-container {
  width: 100%;
  max-width: 440px;
  background: rgba(22, 22, 40, 0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl) var(--space-xl);
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.5),
    0 0 80px rgba(99, 102, 241, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 10;
  animation: fadeInUp 0.6s ease;
}

.login-container.shake {
  animation: shake 0.6s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.logo-container {
  width: 72px;
  height: 72px;
  margin: 0 auto var(--space-md);
  background: var(--accent-gradient);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow:
    0 8px 30px var(--accent-glow),
    0 0 0 4px rgba(99, 102, 241, 0.1);
  animation: pulse-glow 3s ease-in-out infinite;
}

.logo-gem {
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.login-title {
  font-size: 1.8rem;
  font-weight: 900;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
  letter-spacing: -0.03em;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 400;
}

/* Error / Success Banners */
.error-banner,
.success-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: var(--space-md);
  animation: fadeInUp 0.3s ease;
}

.error-banner {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.success-banner {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0 14px;
  transition: all var(--transition-fast);
}

.input-wrapper:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  background: rgba(255, 255, 255, 0.06);
}

.input-icon {
  font-size: 1rem;
  margin-right: 10px;
  flex-shrink: 0;
  opacity: 0.7;
}

.input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 14px 0;
  font-size: 0.95rem;
  box-shadow: none;
}

.input-wrapper input:focus {
  box-shadow: none;
  border-color: transparent;
}

.toggle-password {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.toggle-password:hover {
  opacity: 1;
}

/* Password Strength */
.password-strength {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: 8px;
}

.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-bar {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: var(--bg-input);
  transition: all var(--transition-base);
}

.strength-bar.active {
  background: var(--accent-primary);
}

.strength-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Avatar Picker */
.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.avatar-option {
  width: 46px;
  height: 46px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.avatar-option:hover {
  border-color: var(--border-hover);
  transform: scale(1.08);
}

.avatar-option.selected {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.15);
  box-shadow: 0 0 15px var(--accent-glow);
  transform: scale(1.1);
}

/* Login Button */
.btn-login {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent-gradient);
  color: #fff;
  font-family: var(--font-family);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 6px 25px var(--accent-glow);
  margin-top: var(--space-sm);
  position: relative;
  overflow: hidden;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 35px rgba(99, 102, 241, 0.5);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-login::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transition: left 0.5s ease;
}

.btn-login:hover::before {
  left: 100%;
}

/* Spinner */
.btn-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Auth Switch */
.auth-switch {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-family: var(--font-family);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: color var(--transition-fast);
  text-decoration: none;
  padding: 0;
}

.link-btn:hover {
  color: var(--accent-secondary);
  text-decoration: underline;
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-color);
}

.login-footer p {
  font-size: 0.78rem;
  color: var(--text-muted);
}

@media (max-width: 480px) {
  .login-container {
    padding: var(--space-xl) var(--space-md);
  }

  .login-title {
    font-size: 1.5rem;
  }
}
</style>
