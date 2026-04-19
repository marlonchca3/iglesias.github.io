// Mock de autenticación para desarrollo
// En producción, usar Firebase Auth

let currentUser = null
let authListeners = []

const ADMIN_CREDENTIALS = {
  email: 'admin@iglesias.com',
  password: 'admin123'
}

export async function signInWithEmail(email, password) {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    currentUser = {
      uid: 'admin-user-1',
      email: email,
      displayName: 'Administrador'
    }
    notifyAuthListeners(currentUser)
    localStorage.setItem('auth_user', JSON.stringify(currentUser))
    return currentUser
  }
  throw new Error('Credenciales inválidas')
}

export async function signInWithGoogle() {
  // Mock de Google Sign-In
  currentUser = {
    uid: 'google-user-' + Date.now(),
    email: 'user@gmail.com',
    displayName: 'Usuario Google'
  }
  notifyAuthListeners(currentUser)
  localStorage.setItem('auth_user', JSON.stringify(currentUser))
  return currentUser
}

export function onAuthStateChange(callback) {
  authListeners.push(callback)
  
  // Verificar si hay usuario guardado
  const stored = localStorage.getItem('auth_user')
  if (stored) {
    currentUser = JSON.parse(stored)
    callback(currentUser)
  } else {
    callback(null)
  }
  
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback)
  }
}

function notifyAuthListeners(user) {
  authListeners.forEach(listener => listener(user))
}

export async function logoutAdmin() {
  currentUser = null
  localStorage.removeItem('auth_user')
  notifyAuthListeners(null)
}

export function getCurrentUser() {
  return currentUser
}
