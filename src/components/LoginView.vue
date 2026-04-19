<script setup>
import { ref } from 'vue'
import { signInWithEmail, signInWithGoogle } from '../firebase/auth'

const emit = defineEmits(['logged-in'])

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const user = await signInWithEmail(email.value, password.value)
    emit('logged-in', user)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  loading.value = true
  error.value = ''

  try {
    const user = await signInWithGoogle()
    emit('logged-in', user)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
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
          <label>Email</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="tu@email.com"
            @keyup.enter="handleLogin"
          >
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <div class="password-input">
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="••••••••"
              @keyup.enter="handleLogin"
            >
            <button 
              type="button" 
              class="toggle-password" 
              @click="togglePasswordVisibility"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '⏳ Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <div class="divider">O</div>

      <button class="btn-google" @click="handleGoogleLogin" :disabled="loading">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20'%3E%3Ctext x='3' y='20' font-size='18'%3E🔵%3C/text%3E%3C/svg%3E" alt="">
        {{ loading ? 'Conectando...' : 'Continuar con Google' }}
      </button>

      <div v-if="error" class="error">
        ⚠️ {{ error }}
      </div>

      <div class="login-footer">
        <p>¿Necesitas recuperar tu contraseña?</p>
        <p>Contacta con el administrador</p>
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-container {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 20px;
  padding: 48px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  margin: 0 0 12px;
  font-size: 1.8rem;
  color: #cbd5e1;
}

.login-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.95rem;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #cbd5e1;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #38bdf8;
  background: rgba(30, 41, 59, 0.95);
}

.password-input {
  position: relative;
}

.password-input input {
  width: 100%;
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #94a3b8;
}

.btn-login {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #052e16;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  text-align: center;
  color: #64748b;
  margin: 24px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: rgba(148, 163, 184, 0.3);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.btn-google {
  width: 100%;
  padding: 12px;
  background: rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-google:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.2);
  border-color: rgba(148, 163, 184, 0.5);
}

.btn-google:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-google img {
  width: 20px;
  height: 20px;
}

.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  text-align: center;
}

.login-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.login-footer p {
  margin: 8px 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .login-container {
    padding: 32px 24px;
    margin: 16px;
  }
}
</style>
