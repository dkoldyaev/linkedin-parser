/** Local CV drafts are scoped to the signed-in account. */
const DB_NAME = 'cv_local_storage_db';
const STORE_NAME = 'cv_data';

export interface LocalCVRecord {
  id?: string;
  content: string;
  revision?: number;
  filename?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function cvStorageKey(userId?: number | string | null): string {
  const num = Number(userId);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('A signed-in user is required');
  }
  return `active_cv:${num}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    let value: T;
    const request = operation(tx.objectStore(STORE_NAME));
    request.onsuccess = () => {
      value = request.result;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    const handleAbortOrError = () => {
      db.close();
      reject(tx.error || new Error('CV storage transaction failed'));
    };
    tx.onabort = handleAbortOrError;
    tx.onerror = handleAbortOrError;
  });
}

export async function getLocalCV(userId?: number | string | null): Promise<LocalCVRecord | null> {
  const key = cvStorageKey(userId);
  const res = await transact<LocalCVRecord | undefined>('readonly', (store) => store.get(key));
  return res || null;
}

export async function saveLocalCV(
  cvRecord: LocalCVRecord,
  userId?: number | string | null,
): Promise<LocalCVRecord> {
  const record: LocalCVRecord = {
    ...cvRecord,
    id: cvStorageKey(userId),
    updatedAt: new Date().toISOString(),
  };
  await transact('readwrite', (store) => store.put(record));
  return record;
}

export async function clearLocalCV(userId?: number | string | null): Promise<boolean> {
  const key = cvStorageKey(userId);
  await transact('readwrite', (store) => store.delete(key));
  return true;
}
