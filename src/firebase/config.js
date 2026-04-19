import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Configuración de Firebase
// Usa variables de entorno si están disponibles, sino usa las credenciales por defecto
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDDJPSWkIqvOb3CWYhqHPvUSFe7eXxHksA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'iglesias-app-d4dad.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'iglesias-app-d4dad',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'iglesias-app-d4dad.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1040336104078',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1040336104078:web:0076dea370482f704177df',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-9CM33VJRVX'
}

// Inicializar Firebase
export const app = initializeApp(firebaseConfig)

// Inicializar Firestore
export const db = getFirestore(app)
