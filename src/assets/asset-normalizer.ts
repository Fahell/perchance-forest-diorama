export type AssetRepresentation = "dataUrl" | "canvas" | "image" | "string-url";

export type NormalizedAsset = {
  blob: Blob;
  representation: AssetRepresentation;
  mimeType: string;
  width?: number;
  height?: number;
  /** May be a data URL or an owned object URL; revoke objectUrl when the asset is replaced/disposed. */
  dataUrl: string;
  objectUrl?: string;
  inputs?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCanvasLike(value: unknown): value is HTMLCanvasElement {
  return isRecord(value) && typeof value.toDataURL === "function" && typeof value.width === "number" && typeof value.height === "number";
}

function isImageLike(value: unknown): value is HTMLImageElement {
  return isRecord(value) && (value.tagName === "IMG" || Object.prototype.toString.call(value) === "[object HTMLImageElement]") && typeof value.naturalWidth === "number";
}

function dataUrlMimeType(dataUrl: string): string {
  return dataUrl.match(/^data:([^;,]+)/)?.[1] ?? "image/png";
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",", 2);
  if (!header || encoded === undefined || !header.startsWith("data:")) {
    throw new Error("Invalid image data URL.");
  }
  const isBase64 = /;base64$/i.test(header);
  if (!isBase64) return new Blob([decodeURIComponent(encoded)], { type: dataUrlMimeType(dataUrl) });
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: dataUrlMimeType(dataUrl) });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

function safeInputs(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (["prompt", "negativePrompt", "resolution", "seed", "guidanceScale", "removeBackground"].includes(key)) {
      if (typeof nested === "string" || typeof nested === "number" || typeof nested === "boolean") result[key] = nested;
    }
  }
  return result;
}

async function imageElementToDataUrl(image: HTMLImageElement): Promise<string> {
  if (!image.complete || image.naturalWidth === 0) {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Generated image failed to load.")), { once: true });
    });
  }
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable for image normalization.");
  context.drawImage(image, 0, 0);
  return canvasToDataUrl(canvas);
}

function stringLikeValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Object.prototype.toString.call(value) === "[object String]") return String(value);
  return undefined;
}

/** Converts the observed plugin return shapes into a stable Blob/data URL representation. */
export async function normalizeImageResult(result: unknown): Promise<NormalizedAsset> {
  let dataUrl: string | undefined;
  let representation: AssetRepresentation | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let inputs: Record<string, unknown> | undefined;

  if (isRecord(result)) {
    inputs = safeInputs(result.inputs);
    const directCanvas = result.canvas;
    let iframeOutput: Record<string, unknown> | undefined;
    try {
      const iframe = result.iframe;
      iframeOutput = isRecord(iframe) && isRecord(iframe.textToImagePluginOutput)
        ? iframe.textToImagePluginOutput
        : undefined;
    } catch {
      // Cross-origin iframe properties may be inaccessible; the caller receives a safe unsupported-shape error if no direct output exists.
      iframeOutput = undefined;
    }
    const canvas = isCanvasLike(directCanvas) ? directCanvas : iframeOutput?.canvas;
    const directDataUrl = result.dataUrl;
    const iframeDataUrl = iframeOutput?.dataUrl;
    if (isCanvasLike(canvas)) {
      dataUrl = canvasToDataUrl(canvas);
      representation = "canvas";
      width = canvas.width;
      height = canvas.height;
    } else if (typeof directDataUrl === "string") {
      dataUrl = directDataUrl;
      representation = "dataUrl";
    } else if (typeof iframeDataUrl === "string") {
      dataUrl = iframeDataUrl;
      representation = "dataUrl";
    }
  }

  if (!dataUrl && isImageLike(result)) {
    dataUrl = await imageElementToDataUrl(result);
    representation = "image";
    width = result.naturalWidth;
    height = result.naturalHeight;
  }

  const stringValue = stringLikeValue(result);
  if (!dataUrl && stringValue) {
    if (!/^(data:|https?:\/\/)/.test(stringValue)) throw new Error("Image plugin returned an unrecognized string.");
    if (stringValue.startsWith("data:")) {
      dataUrl = stringValue;
      representation = "dataUrl";
    } else {
      const response = await fetch(stringValue);
      if (!response.ok) throw new Error(`Generated image URL returned HTTP ${response.status}.`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      return {
        blob,
        representation: "string-url",
        mimeType: blob.type || "image/png",
        dataUrl: objectUrl,
        objectUrl,
        inputs,
      };
    }
  }

  if (!dataUrl || !representation) throw new Error("Image plugin result has no supported dataUrl, canvas, image, or URL representation.");
  const blob = dataUrlToBlob(dataUrl);
  return { blob, representation, mimeType: blob.type || "image/png", width, height, dataUrl, inputs };
}

export function disposeNormalizedAsset(asset: NormalizedAsset): void {
  if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
}
