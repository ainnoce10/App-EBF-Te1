
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

// --- CONFIGURATION FIREBASE ---
// 1. Allez sur https://console.firebase.google.com/
// 2. Créez un projet "EBF Management"
// 3. Allez dans Paramètres du projet > Général > Vos applications > Ajouter une application Web (</>)
// 4. Copiez les valeurs de "firebaseConfig" et remplacez-les ci-dessous :

const firebaseConfig = {
  // REMPLACEZ CES VALEURS PAR LES VÔTRES
  apiKey: "VOTRE_API_KEY_ICI",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet-id.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialisation de Firebase
// Note: Si les clés ne sont pas configurées, l'app affichera une erreur dans la console.
const app = initializeApp(firebaseConfig);

// Initialisation de la Base de Données Firestore
export const db = getFirestore(app);

// Export des fonctions Firestore standard pour utilisation dans l'app
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
