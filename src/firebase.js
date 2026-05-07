import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDFTDDkcsb_2N0gDnkvQ0lqbQ_Y-ipupq8",
  authDomain: "quran-app-ba2b8.firebaseapp.com",
  projectId: "quran-app-ba2b8",
  storageBucket: "quran-app-ba2b8.firebasestorage.app",
  messagingSenderId: "267499096642",
  appId: "1:267499096642:web:f08df42f75c7c374e43bdb",
  measurementId: "G-XS35WDJYS9"
}

// Add any admin Gmail addresses here
export const ADMIN_EMAILS = [
  'surooraga@gmail.com',
]

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
