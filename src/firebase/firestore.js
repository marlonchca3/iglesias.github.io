import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { DEFAULT_CHURCHES } from '../data/churches'

// Colección de iglesias en Firestore
const CHURCHES_COLLECTION = 'iglesias'

// Listeners para sincronización en tiempo real
let realTimeUnsubscribe = null

/**
 * Obtener todas las iglesias con sincronización en tiempo real desde Firestore
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para cancelar la suscripción
 */
export function getChurches(callback) {
  try {
    console.log('Leyendo iglesias desde Firestore')
    const churchesRef = collection(db, CHURCHES_COLLECTION)
    const q = query(churchesRef, orderBy('name', 'asc'))
    
    realTimeUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          console.warn('No hay iglesias en Firestore')
          callback([])
          return
        }
        
        const churches = []
        snapshot.forEach((doc) => {
          churches.push({
            id: doc.id,
            ...doc.data(),
            // Convertir timestamps a fechas legibles si existen
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
          })
        })
        
        console.log(`${churches.length} iglesias sincronizadas desde Firestore`)
        callback(churches)
      },
      (error) => {
        console.error('Error en sincronización en tiempo real desde Firestore:', error)
      }
    )
    
    // Retornar función para desuscribirse
    return realTimeUnsubscribe
  } catch (err) {
    console.error('Error configurando listener en Firestore:', err)
    throw err
  }
}

/**
 * Obtener todas las iglesias una sola vez desde Firestore (sin listener)
 * @returns {Promise<Array>} Array de iglesias desde Firestore, vacío si no hay
 */
export async function getChurchesOnce() {
  try {
    console.log('Obteniendo iglesias una sola vez desde Firestore')
    const churchesRef = collection(db, CHURCHES_COLLECTION)
    const q = query(churchesRef, orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.warn('No hay iglesias en Firestore')
      return []
    }
    
    const churches = []
    snapshot.forEach((doc) => {
      churches.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      })
    })
    
    console.log(`${churches.length} iglesias obtenidas desde Firestore`)
    return churches
  } catch (err) {
    console.error('Error obteniendo iglesias desde Firestore:', err)
    throw err
  }
}

/**
 * Agregar una nueva iglesia a Firestore
 * @param {Object} church - Datos de la iglesia
 * @returns {Promise<Object>} Iglesia creada con ID
 */
export async function addChurch(church) {
  try {
    const churchesRef = collection(db, CHURCHES_COLLECTION)
    
    const newChurch = {
      ...church,
      schedules: church.schedules || {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: []
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(churchesRef, newChurch)
    
    return {
      id: docRef.id,
      ...newChurch,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (err) {
    console.error('Error agregando iglesia:', err)
    throw err
  }
}

/**
 * Actualizar una iglesia existente
 * @param {string} id - ID del documento
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function updateChurch(id, data) {
  try {
    const churchRef = doc(db, CHURCHES_COLLECTION, id)
    
    const updates = {
      ...data,
      updatedAt: Timestamp.now()
    }
    
    await updateDoc(churchRef, updates)
  } catch (err) {
    console.error('Error actualizando iglesia:', err)
    throw err
  }
}

/**
 * Eliminar una iglesia
 * @param {string} id - ID del documento
 * @returns {Promise<void>}
 */
export async function deleteChurch(id) {
  try {
    const churchRef = doc(db, CHURCHES_COLLECTION, id)
    await deleteDoc(churchRef)
  } catch (err) {
    console.error('Error eliminando iglesia:', err)
    throw err
  }
}

/**
 * Inicializar colección con datos por defecto (solo si está vacía)
 * @returns {Promise<void>}
 */
export async function initializeChurches() {
  try {
    const snapshot = await getDocs(collection(db, CHURCHES_COLLECTION))
    
    if (snapshot.empty) {
      console.log('Inicializando colección iglesias con datos por defecto...')
      
      for (const church of DEFAULT_CHURCHES) {
        await addDoc(collection(db, CHURCHES_COLLECTION), {
          ...church,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      }
      
      console.log('Colección inicializada correctamente')
    }
  } catch (err) {
    console.error('Error inicializando iglesias:', err)
    throw err
  }
}

/**
 * Detener la sincronización en tiempo real
 */
export function stopRealTimeSync() {
  if (realTimeUnsubscribe) {
    realTimeUnsubscribe()
    realTimeUnsubscribe = null
  }
}
