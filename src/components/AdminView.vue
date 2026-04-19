<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  getChurchesFromFirestore, 
  addChurchToFirestore, 
  updateChurchInFirestore, 
  deleteChurchFromFirestore,
  getChurchesLocal,
  saveChurchesLocal
} from '../firebase/firestore'
import { logoutAdmin } from '../firebase/auth'

const emit = defineEmits(['logout'])

const churches = ref([])
const showForm = ref(false)
const editingId = ref(null)
const editingDay = ref(null)
const fileInput = ref(null)
const loading = ref(true)
const error = ref('')

const formData = ref({
  name: '',
  address: '',
  lat: '',
  lng: '',
  source: ''
})

const dayNames = {
  sun: 'Domingo',
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado'
}

const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

onMounted(async () => {
  try {
    // Usar localStorage directamente (mucho más rápido)
    let allChurches = getChurchesLocal()
    
    // Si localStorage está vacío, intentar Firestore con timeout
    if (!allChurches || allChurches.length === 0) {
      try {
        const fsChurches = await getChurchesFromFirestore()
        if (fsChurches && fsChurches.length > 0) {
          allChurches = fsChurches
        }
      } catch (fsErr) {
        console.warn('Firestore no disponible, usando localStorage')
      }
    }
    
    churches.value = allChurches || []
  } catch (err) {
    console.error('Error cargando iglesias:', err)
    churches.value = []
  }
  loading.value = false
})

function openForm() {
  showForm.value = true
  editingId.value = null
  resetForm()
}

function editChurch(church) {
  editingId.value = church.id
  formData.value = { ...church }
  showForm.value = true
}

function resetForm() {
  formData.value = {
    name: '',
    address: '',
    lat: '',
    lng: '',
    source: ''
  }
}

async function submitForm() {
  if (!formData.value.name || !formData.value.lat || !formData.value.lng) {
    alert('Por favor completa todos los campos requeridos')
    return
  }

  try {
    if (editingId.value) {
      await updateChurchInFirestore(editingId.value, formData.value)
    } else {
      await addChurchToFirestore(formData.value)
    }
    
    // Recargar desde localStorage (fallback más confiable)
    churches.value = getChurchesLocal()
    showForm.value = false
    resetForm()
    alert('✅ Iglesia guardada exitosamente')
  } catch (err) {
    // Incluso con error, guardar en localStorage
    try {
      const allChurches = getChurchesLocal()
      if (editingId.value) {
        const idx = allChurches.findIndex(c => c.id === editingId.value)
        if (idx !== -1) {
          allChurches[idx] = { ...allChurches[idx], ...formData.value }
          saveChurchesLocal(allChurches)
        }
      } else {
        const newId = Math.max(...allChurches.map(c => c.id || 0), 0) + 1
        const newChurch = {
          id: newId,
          name: formData.value.name,
          address: formData.value.address,
          lat: parseFloat(formData.value.lat),
          lng: parseFloat(formData.value.lng),
          source: formData.value.source || 'Usuario',
          schedules: { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] }
        }
        allChurches.push(newChurch)
        saveChurchesLocal(allChurches)
      }
      churches.value = getChurchesLocal()
      showForm.value = false
      resetForm()
      alert('✅ Iglesia guardada en el navegador (localStorage)')
    } catch (localErr) {
      error.value = 'Error: ' + localErr.message
    }
  }
}

async function removeChurch(id) {
  if (confirm('¿Estás seguro de que deseas eliminar esta iglesia?')) {
    try {
      await deleteChurchFromFirestore(id)
    } catch (err) {
      console.warn('Error en Firestore:', err)
    }
    // Siempre eliminar de localStorage
    const allChurches = getChurchesLocal()
    const filtered = allChurches.filter(c => c.id !== id)
    saveChurchesLocal(filtered)
    churches.value = getChurchesLocal()
    alert('✅ Iglesia eliminada')
  }
}

function openScheduleEditor(id) {
  editingId.value = id
}

function closeScheduleEditor() {
  editingId.value = null
}

async function addSchedule(churchId, day) {
  const time = prompt(`Agregar hora para ${dayNames[day]}:`, '18:00')
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    const church = churches.value.find(c => c.id === churchId)
    if (!church.schedules[day].includes(time)) {
      church.schedules[day].push(time)
      church.schedules[day].sort()
      try {
        await updateChurchInFirestore(churchId, church)
      } catch (err) {
        console.warn('Error en Firestore:', err)
      }
      // Siempre guardar en localStorage
      const allChurches = getChurchesLocal()
      const idx = allChurches.findIndex(c => c.id === churchId)
      if (idx !== -1) {
        allChurches[idx] = church
        saveChurchesLocal(allChurches)
      }
      churches.value = getChurchesLocal()
    }
  } else if (time) {
    alert('Formato inválido. Usa HH:MM (ej: 18:00)')
  }
}

async function removeSchedule(churchId, day, time) {
  const church = churches.value.find(c => c.id === churchId)
  church.schedules[day] = church.schedules[day].filter(t => t !== time)
  try {
    await updateChurchInFirestore(churchId, church)
  } catch (err) {
    console.warn('Error en Firestore:', err)
  }
  // Siempre guardar en localStorage
  const allChurches = getChurchesLocal()
  const idx = allChurches.findIndex(c => c.id === churchId)
  if (idx !== -1) {
    allChurches[idx] = church
    saveChurchesLocal(allChurches)
  }
  churches.value = getChurchesLocal()
}

function exportData() {
  const data = JSON.stringify(churches.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'iglesias-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importData() {
  fileInput.value?.click()
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result)
      if (!Array.isArray(data)) {
        alert('El archivo debe contener un array de iglesias')
        return
      }
      
      // Validar estructura básica
      const valid = data.every(church => 
        church.id && 
        church.name && 
        church.lat !== undefined && 
        church.lng !== undefined &&
        church.schedules
      )
      
      if (!valid) {
        alert('El archivo tiene un formato incorrecto')
        return
      }
      
      if (confirm('¿Importar datos? Se sobrescribirán los datos actuales.')) {
        try {
          // Guardar en localStorage como respaldo
          saveChurchesLocal(data)
          // Recargar desde Firestore
          churches.value = await getChurchesFromFirestore()
          alert('✅ Datos importados exitosamente')
        } catch (err) {
          error.value = 'Error importando datos: ' + err.message
        }
      }
    } catch (err) {
      alert('Error al leer el archivo: ' + err.message)
    }
  }
  reader.readAsText(file)
  
  // Limpiar el input
  event.target.value = ''
}

async function handleLogout() {
  if (confirm('¿Cerrar sesión?')) {
    try {
      await logoutAdmin()
      emit('logout')
    } catch (err) {
      error.value = 'Error al cerrar sesión: ' + err.message
    }
  }
}

</script>

<template>
  <div class="admin">
    <header class="admin-header">
      <div class="header-content">
        <h1>🛠️ Panel de Administración</h1>
        <button class="btn-logout" @click="handleLogout">🚪 Cerrar sesión</button>
      </div>
      <div v-if="error" class="error-message">
        ⚠️ {{ error }}
        <button @click="error = ''" class="close-error">✕</button>
      </div>
      <div class="admin-actions">
        <button class="btn-secondary" @click="exportData">⬇️ Descargar datos</button>
        <button class="btn-secondary" @click="importData">⬆️ Cargar datos</button>
        <input 
          ref="fileInput" 
          type="file" 
          accept=".json" 
          style="display: none"
          @change="handleFileUpload"
        >
        <button class="btn-primary" @click="openForm">+ Agregar iglesia</button>
      </div>
    </header>

    <!-- Cargando -->
    <div v-if="loading" class="loading">
      ⏳ Cargando iglesias...
    </div>

    <!-- Formulario para agregar/editar -->
    <div v-if="showForm" class="form-section">
      <h2>{{ editingId ? 'Editar iglesia' : 'Nueva iglesia' }}</h2>
      <div class="form-group">
        <label>Nombre *</label>
        <input v-model="formData.name" type="text" placeholder="Nombre de la iglesia">
      </div>
      <div class="form-group">
        <label>Dirección *</label>
        <input v-model="formData.address" type="text" placeholder="Dirección">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Latitud *</label>
          <input v-model="formData.lat" type="number" step="0.0001" placeholder="-12.0612">
        </div>
        <div class="form-group">
          <label>Longitud *</label>
          <input v-model="formData.lng" type="number" step="0.0001" placeholder="-77.1469">
        </div>
      </div>
      <div class="form-group">
        <label>Fuente</label>
        <input v-model="formData.source" type="text" placeholder="Diócesis del Callao">
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="submitForm">{{ editingId ? 'Actualizar' : 'Crear' }}</button>
        <button class="btn-secondary" @click="showForm = false">Cancelar</button>
      </div>
    </div>

    <!-- Lista de iglesias -->
    <div class="churches-list">
      <h2>Iglesias ({{ churches.length }})</h2>
      <div v-for="church in churches" :key="church.id" class="church-card">
        <div class="church-header">
          <div>
            <h3>{{ church.name }}</h3>
            <p class="address">📍 {{ church.address }}</p>
            <p class="coords">Lat: {{ church.lat }}, Lng: {{ church.lng }}</p>
          </div>
          <div class="church-actions">
            <button class="btn-small" @click="editChurch(church)">Editar</button>
            <button class="btn-small btn-danger" @click="removeChurch(church.id)">Eliminar</button>
          </div>
        </div>

        <!-- Horarios -->
        <div class="schedules">
          <div v-if="editingId !== church.id" class="schedules-view">
            <div v-for="day in dayKeys" :key="day" class="day-schedule">
              <strong>{{ dayNames[day] }}:</strong>
              <span v-if="church.schedules[day].length" class="times">
                {{ church.schedules[day].join(', ') }}
              </span>
              <span v-else class="no-times">Sin horarios</span>
            </div>
            <button class="btn-schedule" @click="openScheduleEditor(church.id)">Editar horarios</button>
          </div>

          <div v-else class="schedules-edit">
            <div v-for="day in dayKeys" :key="day" class="day-edit">
              <strong>{{ dayNames[day] }}</strong>
              <div class="times-list">
                <span v-for="(time, idx) in church.schedules[day]" :key="idx" class="time-tag">
                  {{ time }}
                  <button class="remove-time" @click="removeSchedule(church.id, day, time)">×</button>
                </span>
              </div>
              <button class="btn-add-time" @click="addSchedule(church.id, day)">+ Agregar hora</button>
            </div>
            <button class="btn-schedule" @click="closeScheduleEditor">Listo</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px;
}

.admin-header {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
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

.btn-primary, .btn-secondary, .btn-small, .btn-danger {
  border: 0;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #22c55e;
  color: #052e16;
  font-weight: 700;
}

.btn-primary:hover {
  background: #16a34a;
}

.btn-secondary {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.btn-secondary:hover {
  background: #334155;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.85rem;
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.btn-small:hover {
  background: #334155;
}

.form-section {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 22px;
  margin-bottom: 24px;
}

.form-section h2 {
  margin-top: 0;
  color: #38bdf8;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 10px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e5e7eb;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #38bdf8;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.churches-list {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 22px;
}

.churches-list h2 {
  margin-top: 0;
  color: #38bdf8;
}

.church-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.church-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.church-header h3 {
  margin: 0 0 6px;
  color: #cbd5e1;
}

.church-header p {
  margin: 4px 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.address {
  font-weight: 500;
}

.coords {
  font-size: 0.85rem;
}

.church-actions {
  display: flex;
  gap: 8px;
}

.schedules {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.schedules-view {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.day-schedule {
  background: rgba(15, 23, 42, 0.5);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.day-schedule strong {
  color: #38bdf8;
}

.times {
  display: inline-block;
  margin-left: 8px;
  color: #22c55e;
  font-weight: 500;
}

.no-times {
  display: inline-block;
  margin-left: 8px;
  color: #64748b;
  font-style: italic;
}

.btn-schedule {
  display: block;
  width: 100%;
  padding: 10px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  cursor: pointer;
  margin-top: 8px;
}

.btn-schedule:hover {
  background: #334155;
}

.schedules-edit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.day-edit {
  background: rgba(15, 23, 42, 0.5);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.day-edit strong {
  display: block;
  color: #38bdf8;
  margin-bottom: 8px;
}

.times-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  min-height: 28px;
}

.time-tag {
  background: #22c55e;
  color: #052e16;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.remove-time {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
}

.btn-add-time {
  width: 100%;
  padding: 8px;
  background: #1e293b;
  border: 1px dashed #38bdf8;
  border-radius: 6px;
  color: #38bdf8;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-add-time:hover {
  background: rgba(56, 189, 248, 0.1);
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-actions {
    width: 100%;
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .church-header {
    flex-direction: column;
  }

  .schedules-view {
    grid-template-columns: 1fr;
  }

  .schedules-edit {
    grid-template-columns: 1fr;
  }
}
</style>
