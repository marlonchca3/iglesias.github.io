import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration for iglesias-app-d4dad
const firebaseConfig = {
  apiKey: "AIzaSyDDJPSWkIqvOb3CWYhqHPvUSFe7eXxHksA",
  authDomain: "iglesias-app-d4dad.firebaseapp.com",
  projectId: "iglesias-app-d4dad",
  storageBucket: "iglesias-app-d4dad.firebasestorage.app",
  messagingSenderId: "1040336104078",
  appId: "1:1040336104078:web:0076dea370482f704177df"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Obtener instancias de Auth y Firestore
export const auth = getAuth(app)
export const db = getFirestore(app)

// Verificar autenticación
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export default app
