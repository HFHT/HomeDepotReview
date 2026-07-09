import { openDB, DBSchema, IDBPDatabase } from 'idb';

/** Shape of a single record stored in the `images` IndexedDB object store. */
interface ImageRecord {
  id: string;
  blob: Blob;
  fileName: string;
  mediaType: string;
  order: number;
}

interface ReceiptImageDB extends DBSchema {
  images: {
    key: string;
    value: ImageRecord;
  };
}

const DB_NAME = 'hfh-receipt-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ReceiptImageDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ReceiptImageDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ReceiptImageDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/** Persist (create or overwrite) an image record. */
export async function saveImageRecord(record: ImageRecord): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, record);
}

/** Retrieve all persisted image records (unsorted). */
export async function getAllImageRecords(): Promise<ImageRecord[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/** Retrieve a single image's binary blob, used to build the analyze request. */
export async function getImageBlob(id: string): Promise<Blob | null> {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);
  return record?.blob ?? null;
}

/** Delete a single image record. */
export async function deleteImageRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/** Clear all persisted image records (used after a successful submission). */
export async function clearAllImageRecords(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Converts a `Blob` to a Base64-encoded string (without the `data:` URL
 * prefix), suitable for the {@link ReceiptAnalysisRequest} payload.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Image resizing to satisfy Claude's vision constraints (1568px longest edge,
 * 1.15 megapixel max) is handled separately in `./imageResize.ts`, which
 * consumes `blobToBase64` above.
 */