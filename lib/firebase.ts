import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  writeBatch
} from "firebase/firestore";

// Configuration Firebase EBF
const firebaseConfig = {
  apiKey: "AIzaSyABZpBnwgvDxgHSUldjMZK-ZhqPwGn_HmA",
  authDomain: "bd-app-ebf-te1.firebaseapp.com",
  projectId: "bd-app-ebf-te1",
  storageBucket: "bd-app-ebf-te1.firebasestorage.app",
  messagingSenderId: "486098437562",
  appId: "1:486098437562:web:1ad55335d4b9cea3c8c983"
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de la base de données Firestore
export const db = getFirestore(app);

// Export des fonctions Firestore
export { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  writeBatch
};
