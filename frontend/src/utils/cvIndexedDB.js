/** Local CV drafts are scoped to the signed-in account. */
const DB_NAME = 'cv_local_storage_db';
const STORE_NAME = 'cv_data';

export function cvStorageKey(userId) {
  if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) throw new Error('A signed-in user is required');
  return `active_cv:${Number(userId)}`;
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode, operation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    let value;
    const request = operation(tx.objectStore(STORE_NAME));
    request.onsuccess = () => { value = request.result; };
    tx.oncomplete = () => { db.close(); resolve(value); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('CV storage transaction failed')); };
  });
}

export async function getLocalCV(userId) {
  const key = cvStorageKey(userId);
  return (await transact('readonly', store => store.get(key))) || null;
}

export async function saveLocalCV(cvRecord, userId) {
  const record = { ...cvRecord, id: cvStorageKey(userId), updatedAt: new Date().toISOString() };
  await transact('readwrite', store => store.put(record));
  return record;
}

export async function clearLocalCV(userId) {
  const key = cvStorageKey(userId);
  await transact('readwrite', store => store.delete(key));
  return true;
}
