// Mock implementation to replace missing Firebase SDK
// This allows the application to run without a valid Firebase configuration or installation.

export const db = { type: 'mock-db' };

export const collection = (_db: any, name: string) => ({ type: 'collection', name });
export const doc = (_db: any, col: string, id?: string) => ({ type: 'doc', col, id });

export const getDocs = async (_query: any) => ({ docs: [] });
export const addDoc = async (_col: any, _data: any) => ({ id: 'mock-id-' + Math.random() });
export const setDoc = async (_doc: any, _data: any) => Promise.resolve();
export const updateDoc = async (_doc: any, _data: any) => Promise.resolve();
export const deleteDoc = async (_doc: any) => Promise.resolve();

export const query = (col: any, ...args: any[]) => ({ type: 'query', col, args });
export const where = (field: string, op: string, val: any) => ({ type: 'where', field, op, val });
export const orderBy = (field: string, dir: string = 'asc') => ({ type: 'orderBy', field, dir });

export const onSnapshot = (_query: any, _callback: any, _errorCallback?: any) => {
  // Mock subscription that does nothing.
  // The app will rely on initial state mocks in App.tsx.
  return () => {};
};
