<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getChurches, deleteChurch, syncDefaultChurches } from '../firebase/firestore'
import { logoutAdmin } from '../firebase/auth'

const emit = defineEmits(['logout'])
const churches = ref([])
const loading = ref(true)
const syncing = ref(false)
const error = ref('')
const successMessage = ref('')
let unsubscribeChurches = null

const dayNames = {
  sun: 'Domingo', mon: 'Lunes', tue: 'Martes', wed: 'Miércoles',
  thu: 'Jueves', fri: 'Viernes', sat: 'Sábado'
}
const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

onMounted(() => {
  // Escuchar iglesias en tiempo real desde Firestore
  unsubscribeChurches = getChurches((data) => {
    churches.value = data
    loading.value = false
  })
})

onBeforeUnmount(() => {
  if (unsubscribeChurches) {
    unsubscribeChurches()
  }
})

async function removeChurch(id) {
  if (confirm('¿Eliminar iglesia?')) {
    try {
      await deleteChurch(id)
      // No necesita actualizar manualmente, Firestore dispara el listener automáticamente
    } catch (err) {
      error.value = 'Error: ' + err.message
    }
  }
}

async function syncFromFile() {
  if (!confirm('¿Sincronizar Firestore con los datos de src/data/churches.js?')) return

  syncing.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const count = await syncDefaultChurches()
    successMessage.value = `${count} iglesias sincronizadas.`
  } catch (err) {
    error.value = 'Error: ' + err.message
  } finally {
    syncing.value = false
  }
}

async function handleLogout() {
  if (confirm('¿Cerrar sesión?')) {
    await logoutAdmin()
    emit('logout')
  }
}
</script>

<template>
  <div class="admin">
    <header class="admin-header">
      <h1>🛠️ Panel Administración</h1>
      <div class="admin-actions">
        <button class="btn-sync" :disabled="syncing" @click="syncFromFile">
          {{ syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar archivo' }}
        </button>
        <button class="btn-logout" @click="handleLogout">🚪 Cerrar sesión</button>
      </div>
    </header>

    <div v-if="error" class="error">⚠️ {{ error }}</div>
    <div v-if="successMessage" class="success">✅ {{ successMessage }}</div>
    <div v-if="loading" class="loading">⏳ Cargando...</div>

    <div class="churches-list">
      <h2>Iglesias ({{ churches.length }})</h2>
      <div v-for="church in churches" :key="church.id" class="church-card">
        <div class="church-header">
          <h3>{{ church.name }}</h3>
          <button class="btn-delete" @click="removeChurch(church.docId || church.id)">🗑️</button>
        </div>
        <p>📍 {{ church.address }}</p>
        <p>Lat: {{ church.lat }}, Lng: {{ church.lng }}</p>
        <p v-if="church.source">📋 {{ church.source }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.85);
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 24px;
}
.admin-header h1 {
  margin: 0;
  font-size: 2rem;
}
.admin-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-logout, .btn-delete, .btn-sync {
  background: #ef4444;
  color: white;
  border: 0;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-sync {
  background: #22c55e;
  color: #052e16;
}
.btn-sync:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-logout:hover, .btn-delete:hover {
  background: #dc2626;
}
.btn-sync:hover:not(:disabled) {
  background: #16a34a;
}
.success {
  color: #86efac;
  margin-bottom: 16px;
}
.churches-list {
  background: rgba(15, 23, 42, 0.85);
  border-radius: 20px;
  padding: 22px;
}
.churches-list h2 {
  margin-top: 0;
  color: #38bdf8;
}
.church-card {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.church-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.church-header h3 {
  margin: 0;
  color: #cbd5e1;
}
.church-card p {
  margin: 6px 0;
  color: #94a3b8;
  font-size: 0.9rem;
}
</style>
