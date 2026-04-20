<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getChurches, addChurch, deleteChurch, syncDefaultChurches } from '../firebase/firestore'
import { logoutAdmin } from '../firebase/auth'

const emit = defineEmits(['logout'])
const churches = ref([])
const loading = ref(true)
const syncing = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
let unsubscribeChurches = null

const newChurch = ref({
  name: '',
  address: '',
  lat: '',
  lng: '',
  source: ''
})

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

async function createChurch() {
  error.value = ''
  successMessage.value = ''

  const lat = Number(newChurch.value.lat)
  const lng = Number(newChurch.value.lng)

  if (!newChurch.value.name.trim() || !newChurch.value.address.trim()) {
    error.value = 'Completa el nombre y la dirección.'
    return
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    error.value = 'La latitud y longitud deben ser números válidos.'
    return
  }

  saving.value = true

  try {
    const numericIds = churches.value
      .map(church => Number(church.id))
      .filter(Number.isFinite)
    const nextId = numericIds.length ? Math.max(...numericIds) + 1 : 1

    await addChurch({
      id: nextId,
      name: newChurch.value.name.trim(),
      address: newChurch.value.address.trim(),
      lat,
      lng,
      source: newChurch.value.source.trim(),
      schedules: {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: []
      }
    })

    newChurch.value = {
      name: '',
      address: '',
      lat: '',
      lng: '',
      source: ''
    }
    successMessage.value = 'Iglesia creada en Firestore.'
  } catch (err) {
    error.value = 'Error: ' + err.message
  } finally {
    saving.value = false
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

    <form class="church-form" @submit.prevent="createChurch">
      <h2>Agregar iglesia</h2>
      <div class="form-grid">
        <label>
          Nombre
          <input v-model="newChurch.name" type="text" placeholder="Parroquia..." />
        </label>
        <label>
          Dirección
          <input v-model="newChurch.address" type="text" placeholder="Callao, Perú" />
        </label>
        <label>
          Latitud
          <input v-model="newChurch.lat" type="number" step="any" placeholder="-12.0612" />
        </label>
        <label>
          Longitud
          <input v-model="newChurch.lng" type="number" step="any" placeholder="-77.1469" />
        </label>
        <label>
          Fuente
          <input v-model="newChurch.source" type="text" placeholder="Diócesis del Callao" />
        </label>
      </div>
      <button class="btn-save" type="submit" :disabled="saving">
        {{ saving ? '⏳ Guardando...' : '➕ Crear en Firestore' }}
      </button>
    </form>

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
.btn-logout, .btn-delete, .btn-sync, .btn-save {
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
.btn-save {
  background: #38bdf8;
  color: #082f49;
  margin-top: 16px;
}
.btn-sync:disabled, .btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-logout:hover, .btn-delete:hover {
  background: #dc2626;
}
.btn-sync:hover:not(:disabled) {
  background: #16a34a;
}
.btn-save:hover:not(:disabled) {
  background: #0ea5e9;
}
.success {
  color: #86efac;
  margin-bottom: 16px;
}
.church-form {
  background: rgba(15, 23, 42, 0.85);
  border-radius: 20px;
  padding: 22px;
  margin-bottom: 24px;
}
.church-form h2 {
  margin-top: 0;
  color: #38bdf8;
}
.form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.form-grid label {
  color: #cbd5e1;
  display: grid;
  gap: 8px;
  font-weight: 600;
}
.form-grid input {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  color: #e2e8f0;
  font: inherit;
  padding: 10px 12px;
}
.form-grid input:focus {
  border-color: #38bdf8;
  outline: none;
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
@media (max-width: 760px) {
  .admin-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
