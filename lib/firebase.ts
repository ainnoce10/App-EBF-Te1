
// Mock implementation of Firebase to bypass import errors and provide local persistence
// This replaces the real firebase imports which were causing module resolution errors.

const LOCAL_STORAGE_KEY_PREFIX = 'ebf_mock_db_';

// Helper to get data from local storage
const getCollectionData = (collectionName: string) => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + collectionName);
  return data ? JSON.parse(data) : [];
};

// Helper to set data to local storage and trigger listeners
const setCollectionData = (collectionName: string, data: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + collectionName, JSON.stringify(data));
  triggerListeners(collectionName);
};

const listeners: Record<string, Function[]> = {};

const createDocSnapshot = (d: any, collectionName: string) => ({
  data: () => d,
  id: d.id,
  ref: { colName: collectionName, id: d.id },
  ...d 
});

const triggerListeners = (collectionName: string) => {
  if (listeners[collectionName]) {
    const rawData = getCollectionData(collectionName);
    const docs = rawData.map((d: any) => createDocSnapshot(d, collectionName));
    const snapshot = { docs, empty: docs.length === 0 };
    listeners[collectionName].forEach(cb => cb(snapshot));
  }
};

export const initializeApp = (config: any) => {
  console.log('Mock Firebase Initialized', config);
  return {};
};

export const getFirestore = (app?: any) => ({ type: 'firestore-mock' });

export const db = { type: 'firestore-mock' };

export const collection = (db: any, name: string) => {
  return { type: 'collection', name };
};

export const query = (col: any, ...constraints: any[]) => {
  return { type: 'query', col, constraints };
};

export const where = (field: string, op: string, val: any) => ({ type: 'where', field, op, val });
export const orderBy = (field: string, dir?: string) => ({ type: 'orderBy', field, dir });

export const onSnapshot = (q: any, onNext: (snap: any) => void, onError?: (err: any) => void) => {
  const collectionName = q.col ? q.col.name : q.name;
  
  if (!listeners[collectionName]) {
    listeners[collectionName] = [];
  }
  listeners[collectionName].push(onNext);
  
  // Initial call
  setTimeout(() => triggerListeners(collectionName), 0);
  
  return () => {
    listeners[collectionName] = listeners[collectionName].filter(cb => cb !== onNext);
  };
};

export const doc = (db: any, colName: string, id: string) => {
  return { type: 'doc', colName, id };
};

export const addDoc = async (col: any, data: any) => {
  const collectionName = col.name;
  const currentData = getCollectionData(collectionName);
  const newId = 'mock_id_' + Date.now() + Math.floor(Math.random() * 1000);
  const newItem = { id: newId, ...data };
  
  setCollectionData(collectionName, [...currentData, newItem]);
  return { id: newId };
};

export const setDoc = async (docRef: any, data: any) => {
  const { colName, id } = docRef;
  const currentData = getCollectionData(colName);
  const existingIndex = currentData.findIndex((d: any) => d.id === id);
  
  if (existingIndex >= 0) {
     currentData[existingIndex] = { ...data, id };
  } else {
     currentData.push({ ...data, id });
  }
  setCollectionData(colName, currentData);
};

export const updateDoc = async (docRef: any, data: any) => {
  const { colName, id } = docRef;
  const currentData = getCollectionData(colName);
  const existingIndex = currentData.findIndex((d: any) => d.id === id);
  
  if (existingIndex >= 0) {
     currentData[existingIndex] = { ...currentData[existingIndex], ...data };
     setCollectionData(colName, currentData);
  } else {
    console.warn("Document not found for update:", colName, id);
  }
};

export const deleteDoc = async (docRef: any) => {
  const { colName, id } = docRef;
  const currentData = getCollectionData(colName);
  const newData = currentData.filter((d: any) => d.id !== id);
  setCollectionData(colName, newData);
};

export const getDocs = async (q: any) => {
  const collectionName = q.col ? q.col.name : q.name;
  const rawData = getCollectionData(collectionName);
  const docs = rawData.map((d: any) => createDocSnapshot(d, collectionName));
  return { docs, empty: docs.length === 0 };
};
