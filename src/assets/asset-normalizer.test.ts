import { describe, expect, it } from "vitest";
import { normalizeImageResult } from "./asset-normalizer";

const pixelDataUrl = "data:image/png;base64,iVBORw0KGgo=";

describe("normalizeImageResult", () => {
  it("normalizes a data URL into a Blob and metadata", async () => {
    const normalized = await normalizeImageResult({
      dataUrl: pixelDataUrl,
      inputs: { prompt: "forest", seed: 7, ignored: { secret: true } },
    });

    expect(normalized.representation).toBe("dataUrl");
    expect(normalized.mimeType).toBe("image/png");
    expect(normalized.blob.size).toBeGreaterThan(0);
    expect(normalized.inputs).toEqual({ prompt: "forest", seed: 7 });
  });

  it("accepts a string data URL", async () => {
    const normalized = await normalizeImageResult(pixelDataUrl);
    expect(normalized.dataUrl).toBe(pixelDataUrl);
    expect(normalized.representation).toBe("dataUrl");
  });

  it("accepts a String-like plugin result", async () => {
    const result = new String(pixelDataUrl) as String & { inputs?: Record<string, unknown> };
    result.inputs = { prompt: "forest" };
    const normalized = await normalizeImageResult(result);
    expect(normalized.dataUrl).toBe(pixelDataUrl);
    expect(normalized.representation).toBe("dataUrl");
    expect(normalized.inputs).toEqual({ prompt: "forest" });
  });

  it("accepts the iframe output shape documented by the plugin", async () => {
    const normalized = await normalizeImageResult({
      iframe: { textToImagePluginOutput: { dataUrl: pixelDataUrl } },
    });
    expect(normalized.dataUrl).toBe(pixelDataUrl);
    expect(normalized.representation).toBe("dataUrl");
  });

  it("rejects unsupported values", async () => {
    await expect(normalizeImageResult({ status: "success" })).rejects.toThrow("no supported");
  });
});
