

// --- MOCK FIREBASE IMPLEMENTATION ---
// Cette version simule Firebase en utilisant le LocalStorage du navigateur.
// Elle permet à l'application de fonctionner sans backend configuré.

const DB_PREFIX = 'ebf_db_';
const listeners: Record<string, Function[]> = {};

// --- HELPER FUNCTIONS ---

function getCollectionData(name: string): any[] {
  try {
    const data = localStorage.getItem(DB_PREFIX + name);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function saveCollectionData(name: string, data: any[]) {
  localStorage.setItem(DB_PREFIX + name, JSON.stringify(data));
  triggerListeners(name);
}

function triggerListeners(name: string) {
  if (listeners[name]) {
    const rawData = getCollectionData(name);
    // Simulation du format snapshot Firebase
    const snapshot = {
      docs: rawData.map(d => ({
        id: d.id,
        data: () => d,
        ref: { id: d.id, colName: name }
      })),
      empty: rawData.length === 0,
      size: rawData.length
    };
    listeners[name].forEach(cb => cb(snapshot));
  }
}

// --- FIREBASE API MOCKS ---

export const initializeApp = () => ({});
export const getFirestore = () => ({});
export const db = { type: 'mock' };

export const collection = (_db: any, name: string) => ({ type: 'collection', name });

export const doc = (_db: any, colName: string, id?: string) => ({ 
  type: 'doc', 
  colName: typeof colName === 'object' ? (colName as any).name : colName, 
  id 
});

// Mock Query: on ignore les contraintes pour simplifier, on renvoie juste la réf de collection
export const query = (col: any, ..._constraints: any[]) => col;
export const where = (..._args: any[]) => ({});
export const orderBy = (..._args: any[]) => ({});

// --- WRITE OPERATIONS ---

export const addDoc = async (col: any, data: any) => {
  const collectionName = col.name;
  const items = getCollectionData(collectionName);
  const id = 'gen_' + Date.now() + Math.floor(Math.random() * 10000);
  const newItem = { id, ...data };
  
  saveCollectionData(collectionName, [newItem, ...items]); // Ajout au début
  return { id };
};

export const setDoc = async (docRef: any, data: any) => {
  const { colName, id } = docRef;
  if (!id) throw new Error("ID manquante pour setDoc");
  
  const items = getCollectionData(colName);
  const idx = items.findIndex((i: any) => i.id === id);
  
  const newItem = { ...data, id };
  
  if (idx >= 0) {
    items[idx] = newItem;
  } else {
    items.push(newItem);
  }
  saveCollectionData(colName, items);
};

export const updateDoc = async (docRef: any, data: any) => {
  const { colName, id } = docRef;
  const items = getCollectionData(colName);
  const idx = items.findIndex((i: any) => i.id === id);
  
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...data };
    saveCollectionData(colName, items);
  } else {
    console.warn(`Document ${id} non trouvé dans ${colName}`);
  }
};

export const deleteDoc = async (docRef: any) => {
  const { colName, id } = docRef;
  const items = getCollectionData(colName);
  const newItems = items.filter((i: any) => i.id !== id);
  saveCollectionData(colName, newItems);
};

// --- READ OPERATIONS ---

export const getDocs = async (queryRef: any) => {
  const collectionName = queryRef.name;
  const rawData = getCollectionData(collectionName);
  return {
    docs: rawData.map(d => ({
      id: d.id,
      data: () => d,
      ref: { id: d.id, colName: collectionName }
    })),
    empty: rawData.length === 0
  };
};

export const onSnapshot = (queryRef: any, callback: any, _onError?: any) => {
  const collectionName = queryRef.name;
  
  if (!listeners[collectionName]) listeners[collectionName] = [];
  listeners[collectionName].push(callback);
  
  // Appel initial immédiat
  setTimeout(() => triggerListeners(collectionName), 10);
  
  return () => {
    listeners[collectionName] = listeners[collectionName].filter(cb => cb !== callback);
  };
};

// --- BATCH OPERATIONS (CRUCIAL POUR L'INITIALISATION) ---

export const writeBatch = (_db: any) => {
  const operations: any[] = [];
  
  return {
    set: (docRef: any, data: any) => {
      operations.push({ type: 'set', docRef, data });
    },
    update: (docRef: any, data: any) => {
      operations.push({ type: 'update', docRef, data });
    },
    delete: (docRef: any) => {
      operations.push({ type: 'delete', docRef });
    },
    commit: async () => {
      // Regrouper par collection pour optimiser la sauvegarde
      const colsToProcess = new Set(operations.map(op => op.docRef.colName));
      
      colsToProcess.forEach(colName => {
        let items = getCollectionData(colName as string);
        
        operations.filter(op => op.docRef.colName === colName).forEach(op => {
          const { id } = op.docRef;
          const idx = items.findIndex((i: any) => i.id === id);
          
          if (op.type === 'set') {
            const newItem = { ...op.data, id };
            if (idx >= 0) items[idx] = newItem;
            else items.push(newItem);
          } 
          else if (op.type === 'update') {
            if (idx >= 0) items[idx] = { ...items[idx], ...op.data };
          } 
          else if (op.type === 'delete') {
            if (idx >= 0) items = items.filter((i: any) => i.id !== id);
          }
        });
        
        saveCollectionData(colName as string, items);
      });
      
      return Promise.resolve();
    }
  };
};
