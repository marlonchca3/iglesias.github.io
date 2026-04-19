import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  setDoc
} from 'firebase/firestore'
import { db } from './config'

const CHURCHES_COLLECTION = 'churches'

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

// Obtener todas las iglesias
export async function getChurchesFromFirestore() {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, CHURCHES_COLLECTION), orderBy('id', 'asc'))
    )
    
    if (querySnapshot.empty) {
      // Si no hay datos en Firestore, usar localStorage o predeterminados
      const local = getChurchesLocal()
      if (local && local.length > 0) {
        console.log('Usando iglesias del localStorage')
        return local
      }
      // Si tampoco hay en localStorage, inicializar con predeterminados
      console.log('Inicializando Firestore con iglesias predeterminadas')
      await initializeChurches()
      return DEFAULT_CHURCHES
    }
    
    return querySnapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching churches from Firestore:', error)
    // Fallback a localStorage
    const local = getChurchesLocal()
    if (local && local.length > 0) {
      console.log('Firestore error, usando localStorage:', error.message)
      return local
    }
    return DEFAULT_CHURCHES
  }
}

// Inicializar iglesias predeterminadas
export async function initializeChurches() {
  try {
    for (const church of DEFAULT_CHURCHES) {
      await setDoc(doc(db, CHURCHES_COLLECTION, `church_${church.id}`), church)
    }
  } catch (error) {
    console.error('Error initializing churches:', error)
  }
}

// Agregar iglesia
export function addChurchToFirestore(church) {
  // Primero, obtener iglesias de localStorage (síncrono - muy rápido)
  const allChurches = getChurchesLocal()
  const newId = Math.max(...allChurches.map(c => c.id || 0), 0) + 1
  
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
  
  // Guardar en localStorage primero (inmediato, síncrono)
  allChurches.push(newChurch)
  saveChurchesLocal(allChurches)
  
  // Intentar guardar en Firestore en paralelo (sin bloquear ni esperar)
  // Esto es fire-and-forget para no bloquear la UI
  setDoc(doc(db, CHURCHES_COLLECTION, `church_${newId}`), newChurch)
    .then(() => console.log('Iglesia guardada en Firestore'))
    .catch(fsError => console.warn('Firestore no disponible:', fsError.message))
  
  return newChurch
}

// Actualizar iglesia
export async function updateChurchInFirestore(id, updates) {
  try {
    try {
      // Intentar actualizar en Firestore
      await updateDoc(doc(db, CHURCHES_COLLECTION, `church_${id}`), updates)
      console.log('Iglesia actualizada en Firestore')
    } catch (fsError) {
      console.warn('Error actualizando en Firestore:', fsError.message)
    }
    
    // Siempre actualizar en localStorage como respaldo
    const allChurches = getChurchesLocal()
    const index = allChurches.findIndex(c => c.id === id)
    if (index !== -1) {
      allChurches[index] = { ...allChurches[index], ...updates }
      saveChurchesLocal(allChurches)
    }
  } catch (error) {
    console.error('Error updating church:', error)
    throw error
  }
}

// Eliminar iglesia
export async function deleteChurchFromFirestore(id) {
  try {
    try {
      // Intentar eliminar en Firestore
      await deleteDoc(doc(db, CHURCHES_COLLECTION, `church_${id}`))
      console.log('Iglesia eliminada en Firestore')
    } catch (fsError) {
      console.warn('Error eliminando en Firestore:', fsError.message)
    }
    
    // Siempre eliminar en localStorage como respaldo
    const allChurches = getChurchesLocal()
    const filtered = allChurches.filter(c => c.id !== id)
    saveChurchesLocal(filtered)
  } catch (error) {
    console.error('Error deleting church:', error)
    throw error
  }
}

// Backup para export/import (opcional con localStorage como fallback)
export function getChurchesLocal() {
  try {
    const stored = localStorage.getItem('iglesias_callao_churches')
    return stored ? JSON.parse(stored) : DEFAULT_CHURCHES
  } catch {
    return DEFAULT_CHURCHES
  }
}

export function saveChurchesLocal(churches) {
  try {
    localStorage.setItem('iglesias_callao_churches', JSON.stringify(churches))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}
