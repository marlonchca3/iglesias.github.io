<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import MapView from './components/MapView.vue'
import AdminView from './components/AdminView.vue'
import LoginView from './components/LoginView.vue'
import { getChurchesFromFirestore, getChurchesLocal, startDeviceSyncPolling, initStorageListener, initializeChurches } from './firebase/firestore'
import { onAuthStateChange } from './firebase/auth'

const churches = ref([])
const currentUser = ref(null)
const authLoading = ref(true)
const showLoginPrompt = ref(false)
let syncInterval = null

const userPosition = ref(null)
const errorMessage = ref('')
const permissionState = ref('pendiente')
const notifyEnabled = ref(false)
const watchId = ref(null)
const alertedKey = ref('')

const weekKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const weekNames = {
  sun: 'Domingo',
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado'
}

function toRad(value) {
  return (value * Math.PI) / 180
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function timeToDate(timeString) {
  const now = new Date()
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date(now)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

function formatTime(date) {
  return new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

const todayKey = computed(() => weekKeys[new Date().getDay()])

const churchesWithDistance = computed(() => {
  if (!userPosition.value) return churches
  return churches
    .map(church => ({
      ...church,
      distance: distanceMeters(
        userPosition.value.lat,
        userPosition.value.lng,
        church.lat,
        church.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance)
})

const nearestChurch = computed(() => churchesWithDistance.value?.[0] ?? null)

const todayMasses = computed(() => {
  const church = nearestChurch.value
  if (!church) return []
  return church.schedules[todayKey.value] ?? []
})

const nextMass = computed(() => {
  const now = new Date()
  for (const time of todayMasses.value) {
    const date = timeToDate(time)
    if (date > now) {
      return { time, date }
    }
  }
  return null
})

const nextMessage = computed(() => {
  if (!nearestChurch.value) return 'Activa tu ubicación para ver la iglesia más cercana.'
  if (!todayMasses.value.length) return 'No hay horarios cargados para hoy en esta iglesia.'
  if (!nextMass.value) return 'Ya no quedan misas hoy en la iglesia más cercana.'
  return `Próxima misa en ${nearestChurch.value.name}: ${nextMass.value.time}`
})

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Tu navegador no soporta notificaciones.')
    return
  }

  const result = await Notification.requestPermission()
  notifyEnabled.value = result === 'granted'
}

function maybeNotifyNearestMass() {
  if (!notifyEnabled.value || !nearestChurch.value || !nextMass.value) return

  const distance = nearestChurch.value.distance ?? Infinity
  const minutesLeft = Math.round((nextMass.value.date - new Date()) / 60000)
  const notificationKey = `${nearestChurch.value.id}-${nextMass.value.time}`

  if (distance <= 300 && minutesLeft >= 0 && minutesLeft <= 45 && alertedKey.value !== notificationKey) {
    new Notification('Misa cercana en el Callao', {
      body: `${nearestChurch.value.name} está a ${formatDistance(distance)}. Próxima misa: ${nextMass.value.time}.`,
    })
    alertedKey.value = notificationKey
  }
}

function startTracking() {
  if (!('geolocation' in navigator)) {
    errorMessage.value = 'Tu navegador no soporta geolocalización.'
    return
  }

  // Primero intentar obtener la ubicación actual rápidamente
  navigator.geolocation.getCurrentPosition(
    (position) => {
      permissionState.value = 'concedido'
      errorMessage.value = ''
      userPosition.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }
      maybeNotifyNearestMass()
    },
    (error) => {
      permissionState.value = 'denegado'
      errorMessage.value = `No se pudo obtener tu ubicación: ${error.message}`
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  )

  // Luego monitorear cambios continuos
  watchId.value = navigator.geolocation.watchPosition(
    (position) => {
      permissionState.value = 'concedido'
      userPosition.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }
      maybeNotifyNearestMass()
    },
    (error) => {
      console.error('Error en monitoreo:', error)
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    }
  )
}

onMounted(() => {
  // Inicializar datos
  initializeChurches()
  
  // Cargar iglesias inicialmente
  getChurchesFromFirestore()
    .then(data => {
      churches.value = data
    })
    .catch(err => {
      console.error('Error loading churches:', err)
      churches.value = getChurchesLocal()
    })

  // Configurar listener de autenticación
  onAuthStateChange((user) => {
    currentUser.value = user
    authLoading.value = false
  })

  // Configurar sincronización entre pestañas
  initStorageListener()

  // Iniciar polling para sincronizar con otros dispositivos (cada 5 segundos)
  syncInterval = startDeviceSyncPolling((updatedChurches) => {
    churches.value = updatedChurches
  })

  startTracking()
})

onBeforeUnmount(() => {
  if (watchId.value !== null) navigator.geolocation.clearWatch(watchId.value)
  if (syncInterval) clearInterval(syncInterval)
})
</script>

<template>
  <div class="page">
    <!-- Pantalla de login en modal si se hace clic en Admin -->
    <LoginView 
      v-if="showLoginPrompt" 
      @logged-in="currentUser = $event; showLoginPrompt = false" 
    />

    <!-- Panel de admin si está autenticado -->
    <AdminView v-else-if="currentUser && !authLoading" @logout="currentUser = null" />

    <!-- Contenido principal (visible siempre que no esté en admin) -->
    <template v-else>
      <header class="hero">
        <div>
          <p class="eyebrow">Vue + geolocalización + alertas</p>
          <h1>Misas Callao</h1>
          <p class="subtitle">
            Encuentra la iglesia más cercana y mira sus horarios de misa según tu ubicación actual.
          </p>
        </div>

        <div class="actions">
          <button class="primary" @click="startTracking">Actualizar ubicación</button>
          <button class="secondary" @click="requestNotificationPermission">Activar avisos</button>
          <button class="secondary admin-btn" @click="showLoginPrompt = true">⚙️ Admin</button>
        </div>
      </header>

    <section class="grid top-grid">
      <article class="card status-card">
        <h2>Estado</h2>
        <p><strong>Ubicación:</strong> {{ permissionState }}</p>
        <p><strong>Avisos:</strong> {{ notifyEnabled ? 'activos' : 'desactivados' }}</p>
        <p v-if="userPosition">
          <strong>Precisión:</strong> {{ Math.round(userPosition.accuracy) }} m
        </p>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </article>

      <article class="card highlight-card">
        <h2>Iglesia más cercana</h2>
        <template v-if="nearestChurch">
          <h3>{{ nearestChurch.name }}</h3>
          <p>{{ nearestChurch.address }}</p>
          <p><strong>Distancia:</strong> {{ formatDistance(nearestChurch.distance) }}</p>
          <p><strong>Resumen:</strong> {{ nextMessage }}</p>
        </template>
        <p v-else>Activa tu ubicación para comenzar.</p>
      </article>
    </section>

    <section class="card">
      <h2>Mapa</h2>
      <MapView
        :churches="churchesWithDistance"
        :user-position="userPosition"
        :nearest-church-id="nearestChurch?.id || null"
      />
    </section>

    <section class="grid bottom-grid">
      <article class="card">
        <h2>Horarios de hoy</h2>
        <p class="muted">{{ weekNames[todayKey] }}</p>
        <ul v-if="todayMasses.length" class="times">
          <li v-for="time in todayMasses" :key="time" :class="{ next: nextMass?.time === time }">
            {{ time }}
          </li>
        </ul>
        <p v-else>No hay horarios para hoy.</p>
      </article>

      <article class="card">
        <h2>Iglesias cercanas</h2>
        <div class="church-list">
          <div v-for="church in churchesWithDistance" :key="church.id" class="church-item">
            <div>
              <strong>{{ church.name }}</strong>
              <p>{{ church.address }}</p>
            </div>
            <span v-if="church.distance !== undefined">{{ formatDistance(church.distance) }}</span>
          </div>
        </div>
      </article>
    </section>

    <section class="card notes">
      <h2>Cómo mejorar esta app</h2>
      <ol>
        <li>Mover los horarios a Firebase o Supabase.</li>
        <li>Agregar panel admin para editar horarios especiales.</li>
        <li>Convertirla en PWA para instalarla en Android.</li>
        <li>Usar Web Push desde servidor para recordatorios programados.</li>
      </ol>
    </section>
    </template>
  </div>
</template>
