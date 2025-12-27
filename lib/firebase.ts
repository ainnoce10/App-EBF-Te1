
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';

// --- CONFIGURATION FIREBASE (OBLIGATOIRE POUR LE TEMPS RÉEL) ---
// 1. Créez un projet sur https://console.firebase.google.com/
// 2. Activez "Cloud Firestore" dans la console.
// 3. Copiez la configuration de votre projet ci-dessous.

const firebaseConfig = {
  // REMPLACEZ CES VALEURS PAR CELLES DE VOTRE PROJET FIREBASE
  apiKey: "VOTRE_API_KEY_ICI",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet-id.firebasestorage.app",
  messagingSenderId: "00000000000",
  appId: "1:00000000000:web:xxxxxxxxx"
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de la base de données Firestore
export const db = getFirestore(app);

// Export direct des fonctions officielles pour utilisation dans l'app
// Si la configuration ci-dessus est invalide, ces fonctions échoueront (comportement réel attendu).
export { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch 
};

// Variable utilitaire pour vérifier si la config est présente (optionnel, pour debug)
export const isConfigured = firebaseConfig.apiKey !== "VOTRE_API_KEY_ICI";
