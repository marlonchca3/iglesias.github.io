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
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { DEFAULT_CHURCHES } from '../data/churches'
import { DEFAULT_CHURCH_SCHEDULES } from '../data/churchSchedules'

// Colección de iglesias en Firestore
const CHURCHES_COLLECTION = 'iglesias'
const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const CHURCHES_SEED_SYNC_KEY = 'iglesias:churches-seed-signature:v1'

// Listeners para sincronización en tiempo real
let realTimeUnsubscribe = null

function createEmptySchedules() {
  return WEEK_KEYS.reduce((acc, key) => {
    acc[key] = []
    return acc
  }, {})
}

function normalizeSchedules(schedules = {}) {
  const normalized = createEmptySchedules()

  for (const key of WEEK_KEYS) {
    const values = Array.isArray(schedules[key]) ? schedules[key] : []
    normalized[key] = values
      .map(value => String(value).trim())
      .filter(Boolean)
      .sort()
  }

  return normalized
}

function getSeedSchedules(churchId) {
  return normalizeSchedules(DEFAULT_CHURCH_SCHEDULES[churchId])
}

function getChurchSeedSignature() {
  return JSON.stringify(
    DEFAULT_CHURCHES.map(church => ({
      id: church.id,
      name: church.name,
      address: church.address,
      lat: church.lat,
      lng: church.lng,
      source: church.source || ''
    }))
  )
}

function readStoredSeedSignature() {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage.getItem(CHURCHES_SEED_SYNC_KEY)
}

function writeStoredSeedSignature(signature) {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.setItem(CHURCHES_SEED_SYNC_KEY, signature)
}

async function getChurchRefsByIdentity(churchId, docId) {
  const refs = new Map()

  if (docId) {
    refs.set(docId, doc(db, CHURCHES_COLLECTION, docId))
  }

  if (Number.isFinite(Number(churchId))) {
    const churchesRef = collection(db, CHURCHES_COLLECTION)
    const snapshot = await getDocs(query(churchesRef, where('id', '==', Number(churchId))))

    for (const churchDoc of snapshot.docs) {
      refs.set(churchDoc.id, churchDoc.ref)
    }
  }

  return [...refs.values()]
}

/**
 * Convertir documento de Firestore a objeto iglesia con fechas legibles
 * @private
 */
function convertFirestoreDoc(doc) {
  const data = doc.data()

  return {
    id: doc.id,
    docId: doc.id,
    ...data,
    schedules: normalizeSchedules(data.schedules),
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
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
      schedules: normalizeSchedules(church.schedules),
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
      ...(Object.prototype.hasOwnProperty.call(data, 'schedules')
        ? { schedules: normalizeSchedules(data.schedules) }
        : {}),
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
 * Actualizar una iglesia usando docId y/o el campo id numérico.
 * Útil para corregir datos existentes aunque el documento visible no tenga el id esperado.
 * @param {Object} church - Iglesia actual con docId e id
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<number>} Cantidad de documentos actualizados
 */
export async function updateChurchByIdentity(church, data) {
  try {
    const refs = await getChurchRefsByIdentity(church?.id, church?.docId)

    if (!refs.length) {
      throw new Error('No se encontró el documento de la iglesia en Firestore.')
    }

    const updates = {
      ...data,
      ...(Object.prototype.hasOwnProperty.call(data, 'schedules')
        ? { schedules: normalizeSchedules(data.schedules) }
        : {}),
      updatedAt: Timestamp.now()
    }

    await Promise.all(refs.map(churchRef => updateDoc(churchRef, updates)))
    console.log(`Iglesia actualizada exitosamente en ${refs.length} documento(s)`)
    return refs.length
  } catch (err) {
    console.error('Error actualizando iglesia por identidad:', err)
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
    const seedSignature = getChurchSeedSignature()
    
    if (snapshot.empty) {
      console.log('Inicializando colección iglesias con datos por defecto...')
      
      for (const church of DEFAULT_CHURCHES) {
        await addDoc(collection(db, CHURCHES_COLLECTION), {
          ...church,
          schedules: getSeedSchedules(church.id),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      }
      
      console.log(`Colección inicializada con ${DEFAULT_CHURCHES.length} iglesias`)
      writeStoredSeedSignature(seedSignature)
    } else {
      console.log('Colección iglesias ya tiene datos, inicialización omitida')

      if (!readStoredSeedSignature()) {
        writeStoredSeedSignature(seedSignature)
      }
    }
  } catch (err) {
    console.error('Error inicializando iglesias:', err)
    throw err
  }
}

/**
 * Sincronizar los datos locales de src/data/churches.js con Firestore.
 * Útil cuando editas DEFAULT_CHURCHES y quieres reflejar esos cambios en celulares.
 * @returns {Promise<number>} Cantidad de iglesias sincronizadas
 */
export async function syncDefaultChurches() {
  try {
    console.log('Sincronizando iglesias por defecto con Firestore...')
    const churchesRef = collection(db, CHURCHES_COLLECTION)

    for (const church of DEFAULT_CHURCHES) {
      const q = query(churchesRef, where('id', '==', church.id))
      const snapshot = await getDocs(q)
      const payload = {
        id: church.id,
        name: church.name,
        address: church.address,
        lat: church.lat,
        lng: church.lng,
        source: church.source || '',
        updatedAt: Timestamp.now()
      }

      if (snapshot.empty) {
        await addDoc(churchesRef, {
          ...payload,
          schedules: getSeedSchedules(church.id),
          createdAt: Timestamp.now()
        })
        continue
      }

      for (const churchDoc of snapshot.docs) {
        await updateDoc(churchDoc.ref, payload)
      }
    }

    console.log(`${DEFAULT_CHURCHES.length} iglesias sincronizadas`)
    writeStoredSeedSignature(getChurchSeedSignature())
    return DEFAULT_CHURCHES.length
  } catch (err) {
    console.error('Error sincronizando iglesias por defecto:', err)
    throw err
  }
}

/**
 * Migrar los horarios por defecto al campo schedules en Firestore.
 * Sobrescribe los horarios del documento con la versión semilla local.
 * @returns {Promise<number>} Cantidad de iglesias actualizadas
 */
export async function syncDefaultSchedules() {
  try {
    console.log('Sincronizando horarios por defecto con Firestore...')
    const churchesRef = collection(db, CHURCHES_COLLECTION)
    let updated = 0

    for (const church of DEFAULT_CHURCHES) {
      const q = query(churchesRef, where('id', '==', church.id))
      const snapshot = await getDocs(q)

      for (const churchDoc of snapshot.docs) {
        await updateDoc(churchDoc.ref, {
          schedules: getSeedSchedules(church.id),
          updatedAt: Timestamp.now()
        })
        updated += 1
      }
    }

    console.log(`${updated} horarios sincronizados`)
    return updated
  } catch (err) {
    console.error('Error sincronizando horarios por defecto:', err)
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
