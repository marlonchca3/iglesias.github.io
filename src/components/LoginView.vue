<script setup>
import { ref } from 'vue'
import { loginAdmin, logoutAdmin } from '../firebase/auth'

const emit = defineEmits(['logged-in', 'logged-out'])

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Por favor completa email y contraseña'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const user = await loginAdmin(email.value, password.value)
    email.value = ''
    password.value = ''
    emit('logged-in', user)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  logoutAdmin()
  emit('logged-out')
}

function handleKeyPress(e) {
  if (e.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-modal">
    <div class="login-container">
      <div class="login-header">
        <h2>🔐 Acceso Administrador</h2>
        <p>Solo los administradores pueden editar las iglesias y horarios</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            required
            @keypress="handleKeyPress"
          >
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              @keypress="handleKeyPress"
            >
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          ❌ {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn-login"
          :disabled="loading"
        >
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <div class="login-footer">
        <p>¿Necesitas recuperar tu contraseña?</p>
        <p class="hint">Contacta con el administrador</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(2, 6, 23, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.login-container {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0 0 10px;
  font-size: 1.8rem;
  color: #38bdf8;
}

.login-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #cbd5e1;
  font-size: 0.95rem;
}

.form-group input {
  padding: 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e5e7eb;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  width: 100%;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toggle-password:hover {
  opacity: 1;
}

.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9rem;
  text-align: center;
}

.btn-login {
  padding: 12px;
  background: #22c55e;
  color: #052e16;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-2px);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

.login-footer p {
  margin: 4px 0;
}

.hint {
  color: #64748b;
  font-style: italic;
}

@media (max-width: 600px) {
  .login-container {
    padding: 30px 20px;
    border-radius: 12px;
  }

  .login-header h2 {
    font-size: 1.5rem;
  }
}
</style>
