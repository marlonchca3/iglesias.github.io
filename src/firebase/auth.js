import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth'
import { auth } from './config'

let currentUser = null

function mapFirebaseUser(user) {
  if (!user) return null

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Administrador',
    photoURL: user.photoURL || ''
  }
}

async function ensurePersistence() {
  await setPersistence(auth, browserLocalPersistence)
}

export async function signInWithEmail(email, password) {
  await ensurePersistence()
  const credentials = await signInWithEmailAndPassword(auth, email, password)
  currentUser = mapFirebaseUser(credentials.user)
  return currentUser
}

export async function signInWithGoogle() {
  await ensurePersistence()
  const provider = new GoogleAuthProvider()
  const credentials = await signInWithPopup(auth, provider)
  currentUser = mapFirebaseUser(credentials.user)
  return currentUser
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, user => {
    currentUser = mapFirebaseUser(user)
    callback(currentUser)
  })
}

export async function logoutAdmin() {
  await signOut(auth)
  currentUser = null
}

export function getCurrentUser() {
  return currentUser
}
