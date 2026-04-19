// Datos por defecto
const DEFAULT_CHURCHES = [
  {
    id: 1,
    name: 'Basílica Catedral del Callao',
    address: 'Plaza Grau, Callao',
    lat: -12.0612,
    lng: -77.1469,
    source: 'Diócesis del Callao',
    schedules: {
      mon: ['18:00'],
      tue: ['18:00'],
      wed: ['18:00'],
      thu: ['18:00'],
      fri: ['18:00'],
      sat: ['18:00'],
      sun: ['08:00', '12:00', '18:00']
    }
  },
  {
    id: 2,
    name: 'Parroquia Santa Rosa',
    address: 'Callao, Perú',
    lat: -12.0468,
    lng: -77.1288,
    source: 'Diócesis del Callao',
    schedules: {
      mon: ['19:00'],
      tue: ['19:00'],
      wed: ['19:00'],
      thu: ['19:00'],
      fri: ['19:00'],
      sat: ['19:00'],
      sun: ['07:30', '10:00', '19:00']
    }
  },
  {
    id: 3,
    name: 'Parroquia Virgen del Carmen de la Legua',
    address: 'Carmen de la Legua-Reynoso, Callao',
    lat: -12.0475,
    lng: -77.0925,
    source: 'Diócesis del Callao',
    schedules: {
      mon: ['19:00'],
      tue: ['19:00'],
      wed: ['19:00'],
      thu: ['19:00'],
      fri: ['19:00'],
      sat: ['19:00'],
      sun: ['08:00', '10:00', '12:00', '18:00', '19:00']
    }
  },
  {
    id: 4,
    name: 'Parroquia San Pedro el Pescador',
    address: 'La Perla, Callao',
    lat: -12.0732,
    lng: -77.1216,
    source: 'Diócesis del Callao',
    schedules: {
      mon: ['19:00'],
      tue: ['19:00'],
      wed: ['19:00'],
      thu: ['19:00'],
      fri: ['19:00'],
      sat: ['19:00'],
      sun: ['19:00']
    }
  },
  {
    id: 5,
    name: 'Parroquia Santo Toribio de Mogrovejo',
    address: 'Bocanegra, Callao',
    lat: -12.0234,
    lng: -77.1107,
    source: 'Diócesis del Callao',
    schedules: {
      mon: ['19:30'],
      tue: ['19:30'],
      wed: ['19:30'],
      thu: ['19:30'],
      fri: ['19:30'],
      sat: [],
      sun: ['07:30', '11:00', '19:30']
    }
  }
]

const STORAGE_KEY = 'iglesias_callao_churches'

export function getChurches() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_CHURCHES
    
    const parsed = JSON.parse(stored)
    // Validar que es un array válido con iglesias
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CHURCHES
    }
    
    // Validar que cada iglesia tiene las propiedades necesarias
    const valid = parsed.every(church => 
      church && 
      typeof church === 'object' && 
      church.id && 
      church.name && 
      church.lat !== undefined && 
      church.lng !== undefined &&
      church.schedules &&
      typeof church.schedules === 'object'
    )
    
    return valid ? parsed : DEFAULT_CHURCHES
  } catch (error) {
    console.error('Error loading churches:', error)
    return DEFAULT_CHURCHES
  }
}

export function saveChurches(churches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(churches))
    return true
  } catch {
    return false
  }
}

export function addChurch(church) {
  const churches = getChurches()
  const newId = Math.max(...churches.map(c => c.id), 0) + 1
  const newChurch = {
    id: newId,
    name: church.name,
    address: church.address,
    lat: parseFloat(church.lat),
    lng: parseFloat(church.lng),
    source: church.source || 'Usuario',
    schedules: {
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
  saveChurches(churches)
  return newChurch
}

export function updateChurch(id, updates) {
  const churches = getChurches()
  const index = churches.findIndex(c => c.id === id)
  if (index !== -1) {
    churches[index] = { ...churches[index], ...updates }
    saveChurches(churches)
    return churches[index]
  }
  return null
}

export function deleteChurch(id) {
  const churches = getChurches()
  const filtered = churches.filter(c => c.id !== id)
  saveChurches(filtered)
  return true
}

export function resetToDefaults() {
  saveChurches(DEFAULT_CHURCHES)
  return true
}
