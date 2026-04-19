import { DEFAULT_CHURCHES } from '../data/churches'

const STORAGE_KEY = 'churches_data'
const LAST_UPDATE_KEY = 'churches_last_update'
const SYNC_INTERVAL = 5000 // Sincronizar cada 5 segundos

let syncCallback = null

// Inicializar con datos por defecto si no existen
export function initializeChurches() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    saveChurchesLocal(DEFAULT_CHURCHES)
  }
}

export function getChurchesLocal() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : DEFAULT_CHURCHES
  } catch (err) {
    console.error('Error reading churches from localStorage:', err)
    return DEFAULT_CHURCHES
  }
}

export function saveChurchesLocal(churches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(churches))
    localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString())
  } catch (err) {
    console.error('Error saving churches to localStorage:', err)
  }
}

export function getLastUpdate() {
  const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY)
  return lastUpdate ? parseInt(lastUpdate) : 0
}

// Simulación de Firestore - guarda datos en localStorage y simula sincronización
export async function getChurchesFromFirestore() {
  try {
    // En dev, usar localStorage
    return getChurchesLocal()
  } catch (err) {
    console.error('Error fetching churches:', err)
    return getChurchesLocal()
  }
}

export async function addChurchToFirestore(church) {
  try {
    const churches = getChurchesLocal()
    const newId = Math.max(0, ...churches.map(c => c.id)) + 1
    const newChurch = {
      ...church,
      id: newId,
      schedules: church.schedules || {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: []
      }
    }
    churches.push(newChurch)
    saveChurchesLocal(churches)
    notifySyncListeners()
    return newChurch
  } catch (err) {
    console.error('Error adding church:', err)
    throw err
  }
}

export async function updateChurchInFirestore(id, updates) {
  try {
    const churches = getChurchesLocal()
    const idx = churches.findIndex(c => c.id === id)
    if (idx !== -1) {
      churches[idx] = { ...churches[idx], ...updates }
      saveChurchesLocal(churches)
      notifySyncListeners()
    }
  } catch (err) {
    console.error('Error updating church:', err)
    throw err
  }
}

export async function deleteChurchFromFirestore(id) {
  try {
    const churches = getChurchesLocal()
    const filtered = churches.filter(c => c.id !== id)
    saveChurchesLocal(filtered)
    notifySyncListeners()
  } catch (err) {
    console.error('Error deleting church:', err)
    throw err
  }
}

// Sistema de sincronización entre pestañas/dispositivos
export function onSyncChange(callback) {
  syncCallback = callback
}

function notifySyncListeners() {
  if (syncCallback) {
    syncCallback(getChurchesLocal())
  }
}

// Escuchar cambios en localStorage desde otras pestañas
export function initStorageListener() {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      notifySyncListeners()
    }
  })
}

// Polling para sincronizar entre dispositivos
export function startDeviceSyncPolling(callback) {
  let lastUpdate = getLastUpdate()
  
  const interval = setInterval(() => {
    const currentUpdate = getLastUpdate()
    if (currentUpdate > lastUpdate) {
      lastUpdate = currentUpdate
      callback(getChurchesLocal())
    }
  }, SYNC_INTERVAL)
  
  return interval
}
