import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from './config'

export async function loginAdmin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw new Error(getErrorMessage(error.code))
  }
}

export async function logoutAdmin() {
  try {
    await signOut(auth)
  } catch (error) {
    throw new Error(getErrorMessage(error.code))
  }
}

export function getCurrentUser() {
  return auth.currentUser
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback)
}

function getErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-email': 'Email inválido',
    'auth/user-disabled': 'Usuario deshabilitado',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
    'auth/invalid-credential': 'Email o contraseña incorrectos'
  }
  return messages[code] || 'Error de autenticación'
}

export { auth }
