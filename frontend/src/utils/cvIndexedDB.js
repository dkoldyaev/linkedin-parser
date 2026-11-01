/**
 * Client-side IndexedDB persistence for Local CV Management.
 * Guarantees raw CV files and user draft edits never leave the browser.
 */

const DB_NAME = 'cv_local_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'cv_data';
const CURRENT_CV_KEY = 'active_cv';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function getLocalCV() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(CURRENT_CV_KEY);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalCV(cvRecord) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const dataToSave = {
      ...cvRecord,
      id: CURRENT_CV_KEY,
      updatedAt: new Date().toISOString(),
    };
    const req = store.put(dataToSave);

    req.onsuccess = () => resolve(dataToSave);
    req.onerror = () => reject(req.error);
  });
}

export async function clearLocalCV() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(CURRENT_CV_KEY);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
