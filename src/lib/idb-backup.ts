/**
 * DeclaraPro 210 - Sistema de Persistencia Segura y Base de Datos Local (IndexedDB)
 * 
 * Garantiza que las declaraciones, documentos de clientes y copias multianuales
 * se guarden en almacenamiento permanente no volátil (IndexedDB), protegido ante
 * borrados accidentales de caché básica o cierres del navegador.
 */

const DB_NAME = "DeclaraPro_Database_v1";
const STORE_NAME = "client_snapshots";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB no soportado en este entorno."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda una copia de seguridad en IndexedDB
 */
export async function saveSnapshotToIdb(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const record = {
        key,
        value,
        savedAt: new Date().toISOString(),
      };
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("[IndexedDB Backup] No se pudo guardar snapshot:", err);
  }
}

/**
 * Recupera una copia de seguridad de IndexedDB
 */
export async function getSnapshotFromIdb<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? (result.value as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("[IndexedDB Backup] No se pudo leer snapshot:", err);
    return null;
  }
}
