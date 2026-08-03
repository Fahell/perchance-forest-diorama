import { getPlugin, type PluginFunction } from "./perchance-root";

export type ImageOptions = {
  prompt: string;
  negativePrompt: string;
  resolution: "512x512" | "512x768" | "768x512";
  seed: number;
  guidanceScale: number;
  hideGalleryButtons: boolean;
  removeBackground?: boolean;
};

export type NarrativeOptions = {
  instruction: string;
  startWith?: string;
  stopSequences?: string[];
  onStart?: (data: unknown) => void;
  onChunk?: (data: unknown) => void;
  onFinish?: (data: unknown) => void;
};

export type ImageResult = string & {
  dataUrl?: string;
  canvas?: HTMLCanvasElement;
  inputs?: Record<string, unknown>;
};

export function getTextPlugin(): PluginFunction | null {
  return getPlugin("ai");
}

export function getImagePlugin(): PluginFunction | null {
  return getPlugin("image");
}

export async function generateNarrative(options: NarrativeOptions): Promise<unknown> {
  const plugin = getTextPlugin();
  if (!plugin) throw new Error("root.ai is unavailable in this Perchance context.");
  return plugin(options);
}

export async function generateImage(options: ImageOptions): Promise<unknown> {
  const plugin = getImagePlugin();
  if (!plugin) throw new Error("root.image is unavailable in this Perchance context.");
  return plugin(options);
}
