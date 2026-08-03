export type AssetCacheKey = {
  sceneId: string;
  sceneVersion: string;
  assetId: string;
  promptVersion: string;
  promptHash: string;
  pluginOptionsHash: string;
};

export type CachedAsset = AssetCacheKey & {
  blob: Blob;
  mimeType: string;
  representation: string;
  createdAt: number;
  width?: number;
  height?: number;
  effectiveInputs?: Record<string, unknown>;
};

export type AssetCacheStatus = {
  available: boolean;
  persistent: boolean | null;
  error?: string;
};

export interface AssetCache {
  readonly status: AssetCacheStatus;
  get(key: AssetCacheKey): Promise<CachedAsset | undefined>;
  put(asset: CachedAsset): Promise<void>;
  delete(key: AssetCacheKey): Promise<void>;
  clearScene(sceneId: string, sceneVersion: string): Promise<void>;
  clearAll(): Promise<void>;
  close(): void;
}

const DB_NAME = "perchance-forest-diorama";
const DB_VERSION = 1;
const STORE_NAME = "assets";
export function assetCacheKey(key: AssetCacheKey): string {
  return JSON.stringify([key.sceneId, key.sceneVersion, key.assetId, key.promptVersion, key.promptHash, key.pluginOptionsHash]);
}

function isQuotaError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

function safeError(error: unknown): string {
  if (isQuotaError(error)) return "IndexedDB quota exceeded.";
  return error instanceof Error ? error.message : String(error);
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

export class IndexedDbAssetCache implements AssetCache {
  readonly status: AssetCacheStatus = { available: this.isAvailable(), persistent: null };
  private db: IDBDatabase | null = null;
  private opening: Promise<IDBDatabase> | null = null;

  async get(key: AssetCacheKey): Promise<CachedAsset | undefined> {
    const db = await this.open();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(assetCacheKey(key));
    return requestResult(request) as Promise<CachedAsset | undefined>;
  }

  async put(asset: CachedAsset): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ ...asset, id: assetCacheKey(asset) });
    try {
      await transactionDone(transaction);
    } catch (error) {
      this.status.error = safeError(error);
      if (isQuotaError(error)) throw new Error("IndexedDB quota exceeded while saving the generated asset.");
      throw error;
    }
  }

  async delete(key: AssetCacheKey): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(assetCacheKey(key));
    await transactionDone(transaction);
  }

  async clearScene(sceneId: string, sceneVersion: string): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const asset = cursor.value as CachedAsset & { id: string };
      if (asset.sceneId === sceneId && asset.sceneVersion === sceneVersion) cursor.delete();
      cursor.continue();
    };
    await transactionDone(transaction);
  }

  async clearAll(): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    await transactionDone(transaction);
  }

  close(): void {
    this.db?.close();
    this.db = null;
    this.opening = null;
  }

  private isAvailable(): boolean {
    try {
      return typeof indexedDB !== "undefined";
    } catch {
      return false;
    }
  }

  private async open(): Promise<IDBDatabase> {
    if (!this.status.available) throw new Error("IndexedDB is unavailable in this browser context.");
    if (this.db) return this.db;
    if (this.opening) return this.opening;

    this.opening = new Promise<IDBDatabase>((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
      request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked by another open connection."));
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        this.db = database;
        // Opening the store proves availability, not that the browser granted persistent storage.
        void navigator.storage?.persisted?.().then((persistent) => {
          this.status.persistent = persistent;
        }).catch(() => {
          this.status.persistent = null;
        });
        resolve(database);
      };
    }).catch((error) => {
      this.status.error = safeError(error);
      this.status.persistent = false;
      throw new Error(`IndexedDB unavailable: ${this.status.error}`);
    }).finally(() => {
      this.opening = null;
    });

    return this.opening;
  }
}
