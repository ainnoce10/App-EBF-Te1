
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { 
  getFirestore, 
  collection as _collection, 
  doc as _doc, 
  addDoc as _addDoc, 
  setDoc as _setDoc, 
  updateDoc as _updateDoc, 
  deleteDoc as _deleteDoc, 
  getDocs as _getDocs, 
  query as _query, 
  where as _where, 
  orderBy as _orderBy, 
  onSnapshot as _onSnapshot, 
  writeBatch as _writeBatch
} from 'firebase/firestore';

// --- CONFIGURATION FIREBASE ---
// Pour connecter l'application :
// 1. Créez un projet sur https://console.firebase.google.com/
// 2. Remplacez les valeurs ci-dessous par celles de votre projet
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY_ICI",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet-id.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// DÉTECTION DU MODE DÉMO
// Si la config est celle par défaut, on passe en mode "Mock" (Simulation) pour ne pas faire planter l'app
export const isConfigured = firebaseConfig.apiKey !== "VOTRE_API_KEY_ICI";

let app;
let realDb: any;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    realDb = getFirestore(app);
  } catch (e) {
    console.error("Erreur init Firebase:", e);
  }
} else {
  console.warn("⚠️ FIREBASE NON CONFIGURÉ : L'application tourne en mode DÉMONSTRATION locale.");
}

// Export de la DB (réelle ou null en mock)
export const db = isConfigured ? realDb : null;

// --- WRAPPERS DE SÉCURITÉ (MOCK ADAPTER) ---
// Ces fonctions remplacent les fonctions Firebase si la config est manquante
// Cela permet à l'UI de fonctionner (cliquer sur les boutons, voir les formulaires) sans erreur.

export const collection = isConfigured ? _collection : (db: any, path: string) => ({ type: 'mock_collection', path });

export const doc = isConfigured ? _doc : (db: any, path: string, ...segments: string[]) => ({ type: 'mock_doc', path: [path, ...segments].join('/') });

export const addDoc = isConfigured ? _addDoc : async (ref: any, data: any) => {
  console.log("MOCK ADD DOC:", data);
  return { id: "mock_id_" + Date.now() };
};

export const setDoc = isConfigured ? _setDoc : async (ref: any, data: any) => {
  console.log("MOCK SET DOC:", data);
  return Promise.resolve();
};

export const updateDoc = isConfigured ? _updateDoc : async (ref: any, data: any) => {
  console.log("MOCK UPDATE DOC:", data);
  return Promise.resolve();
};

export const deleteDoc = isConfigured ? _deleteDoc : async (ref: any) => {
  console.log("MOCK DELETE DOC");
  return Promise.resolve();
};

export const getDocs = isConfigured ? _getDocs : async (query: any) => {
  return { empty: true, docs: [] };
};

export const query = isConfigured ? _query : (ref: any, ...constraints: any[]) => ({ type: 'mock_query', ref });

export const where = isConfigured ? _where : (field: string, op: string, value: any) => ({ type: 'constraint', field, op, value });

export const orderBy = isConfigured ? _orderBy : (field: string, dir?: string) => ({ type: 'sort', field, dir });

export const onSnapshot = isConfigured ? _onSnapshot : (query: any, onNext: any, onError?: any) => {
  // En mode mock, on ne renvoie rien via snapshot, l'app utilisera ses données initiales (constantes)
  // On retourne une fonction de nettoyage vide
  return () => {};
};

export const writeBatch = isConfigured ? _writeBatch : (db: any) => ({
  set: (ref: any, data: any) => console.log("Batch Set", data),
  update: (ref: any, data: any) => console.log("Batch Update", data),
  delete: (ref: any) => console.log("Batch Delete"),
  commit: async () => { console.log("Batch Commit"); return Promise.resolve(); }
});
