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
 * Convertir documento de Firestore a objeto iglesia con fechas legibles
 * @private
 */
function convertFirestoreDoc(doc) {
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
  }
}

/**
 * Escuchar cambios en tiempo real de todas las iglesias desde Firestore
 * @param {Function} callback - Se ejecuta cada vez que hay cambios, recibe array de iglesias
 * @returns {Function} Función para cancelar la suscripción
 */
export function listenChurches(callback) {
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
        
        const churches = snapshot.docs.map(convertFirestoreDoc)
        console.log(`${churches.length} iglesias sincronizadas desde Firestore`)
        callback(churches)
      },
      (error) => {
        console.error('Error en sincronización en tiempo real desde Firestore:', error)
      }
    )
    
    return realTimeUnsubscribe
  } catch (err) {
    console.error('Error configurando listener en Firestore:', err)
    throw err
  }
}

/**
 * Alias para listenChurches (compatibilidad)
 */
export function getChurches(callback) {
  return listenChurches(callback)
}

/**
 * Obtener todas las iglesias una sola vez desde Firestore (sin listener)
 * @returns {Promise<Array>} Array de iglesias desde Firestore, vacío si no hay
 */
export async function getChurchesOnce() {
  try {
    console.log('Leyendo iglesias desde Firestore (una sola vez)')
    const churchesRef = collection(db, CHURCHES_COLLECTION)
    const q = query(churchesRef, orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.warn('No hay iglesias en Firestore')
      return []
    }
    
    const churches = snapshot.docs.map(convertFirestoreDoc)
    console.log(`${churches.length} iglesias obtenidas desde Firestore`)
    return churches
  } catch (err) {
    console.error('Error obteniendo iglesias desde Firestore:', err)
    throw err
  }
}

/**
 * Agregar una nueva iglesia a Firestore
 * @param {Object} church - Datos de la iglesia { name, address, lat, lng, schedules, etc }
 * @returns {Promise<Object>} Iglesia creada con ID desde Firestore
 */
export async function addChurch(church) {
  try {
    console.log('Agregando iglesia a Firestore:', church.name)
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
    console.log('Iglesia agregada exitosamente con ID:', docRef.id)
    
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
 * Actualizar una iglesia existente en Firestore
 * @param {string} id - ID del documento en Firestore
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function updateChurch(id, data) {
  try {
    console.log('Actualizando iglesia en Firestore:', id)
    const churchRef = doc(db, CHURCHES_COLLECTION, id)
    
    const updates = {
      ...data,
      updatedAt: Timestamp.now()
    }
    
    await updateDoc(churchRef, updates)
    console.log('Iglesia actualizada exitosamente:', id)
  } catch (err) {
    console.error('Error actualizando iglesia:', err)
    throw err
  }
}

/**
 * Eliminar una iglesia de Firestore
 * @param {string} id - ID del documento a eliminar
 * @returns {Promise<void>}
 */
export async function deleteChurch(id) {
  try {
    console.log('Eliminando iglesia de Firestore:', id)
    const churchRef = doc(db, CHURCHES_COLLECTION, id)
    await deleteDoc(churchRef)
    console.log('Iglesia eliminada exitosamente:', id)
  } catch (err) {
    console.error('Error eliminando iglesia:', err)
    throw err
  }
}

/**
 * Inicializar colección con datos por defecto (solo si está vacía)
 * Se ejecuta una sola vez al cargar la aplicación
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
      
      console.log(`Colección inicializada con ${DEFAULT_CHURCHES.length} iglesias`)
    } else {
      console.log('Colección iglesias ya tiene datos, inicialización omitida')
    }
  } catch (err) {
    console.error('Error inicializando iglesias:', err)
    throw err
  }
}

/**
 * Detener la sincronización en tiempo real
 * Se debe llamar al desmontar el componente
 */
export function stopRealTimeSync() {
  if (realTimeUnsubscribe) {
    console.log('Deteniendo sincronización en tiempo real de Firestore')
    realTimeUnsubscribe()
    realTimeUnsubscribe = null
  }
}
