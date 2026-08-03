// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { assetCacheKey, IndexedDbAssetCache, type AssetCacheKey, type CachedAsset } from "./asset-cache";

const key: AssetCacheKey = {
  sceneId: "scene",
  sceneVersion: "v1",
  assetId: "background",
  promptVersion: "p1",
  promptHash: "hash",
  pluginOptionsHash: "options",
};

function asset(overrides: Partial<CachedAsset> = {}): CachedAsset {
  return {
    ...key,
    blob: new Blob(["asset"], { type: "image/png" }),
    mimeType: "image/png",
    representation: "dataUrl",
    createdAt: Date.now(),
    ...overrides,
  };
}

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("perchance-forest-diorama");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Test database deletion was blocked."));
  });
});

describe("IndexedDbAssetCache", () => {
  it("creates a stable composite key", () => {
    expect(assetCacheKey(key)).toContain("scene");
    expect(assetCacheKey(key)).not.toBe(assetCacheKey({ ...key, promptHash: "different" }));
  });

  it("stores and retrieves an asset", async () => {
    const cache = new IndexedDbAssetCache();
    await cache.put(asset());
    const result = await cache.get(key);

    expect(result?.blob.size).toBeGreaterThan(0);
    expect(result?.assetId).toBe("background");
    cache.close();
  });

  it("clears only the requested scene version", async () => {
    const cache = new IndexedDbAssetCache();
    await cache.put(asset());
    await cache.put(asset({ sceneVersion: "v2", promptHash: "v2" }));

    await cache.clearScene("scene", "v1");
    expect(await cache.get(key)).toBeUndefined();
    expect(await cache.get({ ...key, sceneVersion: "v2", promptHash: "v2" })).toBeDefined();
    cache.close();
  });

  it("clears all assets", async () => {
    const cache = new IndexedDbAssetCache();
    await cache.put(asset());
    await cache.clearAll();
    expect(await cache.get(key)).toBeUndefined();
    cache.close();
  });
});
