import { openDB, DBSchema, IDBPDatabase } from 'idb';

/** Shape of the single avatar record stored per signed-in account. */
interface AvatarRecord {
  /** MSAL `homeAccountId` — uniquely identifies the signed-in user. */
  id: string;
  blob: Blob;
  mediaType: string;
}

interface AvatarDB extends DBSchema {
  avatars: {
    key: string;
    value: AvatarRecord;
  };
}

const DB_NAME = 'hfh-user-avatar';
const STORE_NAME = 'avatars';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AvatarDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AvatarDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AvatarDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/** Persist (create or overwrite) the avatar for a given account id. */
export async function saveAvatarRecord(record: AvatarRecord): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, record);
}

/** Retrieve the persisted avatar for a given account id, if any. */
export async function getAvatarRecord(id: string): Promise<AvatarRecord | null> {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);
  return record ?? null;
}

/** Delete a single avatar record (e.g. on sign-out). */
export async function deleteAvatarRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/** Clear all persisted avatar records. */
export async function clearAllAvatarRecords(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}