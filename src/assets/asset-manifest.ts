export type AssetKind = "background" | "prop" | "character" | "foreground";
export type AssetManifestEntry = {
  id: string;
  kind: AssetKind;
  prompt: string;
  negativePrompt: string;
  resolution: "512x512" | "512x768" | "768x512";
  removeBackground: boolean;
  promptVersion: string;
};

const STYLE_PREFIX = "original HD-2D JRPG-inspired diorama, authorial fantasy forest trail, rich painted environment, cinematic filtered sunlight, layered depth, warm and cool atmospheric contrast, clean silhouette, no text, no watermark, no logo";
const NEGATIVE = "text, watermark, logo, frame, blurry, low quality, deformed, duplicated subject";

export const SCENE_ID = "authorial-forest-trail";
export const SCENE_VERSION = "mvp-0.1";

export const ASSET_MANIFEST: readonly AssetManifestEntry[] = [
  { id: "forest-background", kind: "background", prompt: `${STYLE_PREFIX}, distant woodland trail and small clearing, monumental trees, soft mist, landscape composition`, negativePrompt: NEGATIVE, resolution: "768x512", removeBackground: false, promptVersion: "forest-style-1" },
  { id: "forest-prop", kind: "prop", prompt: `${STYLE_PREFIX}, isolated ancient mossy stone, full object, neutral presentation, transparent background`, negativePrompt: `${NEGATIVE}, connected scenery, cast shadow`, resolution: "512x512", removeBackground: true, promptVersion: "forest-style-1" },
  { id: "player-avatar", kind: "character", prompt: `${STYLE_PREFIX}, isolated full-body young traveler avatar, neutral standing pose, readable silhouette, transparent background`, negativePrompt: `${NEGATIVE}, scenery, ground, cast shadow, cropped body`, resolution: "512x768", removeBackground: true, promptVersion: "forest-style-1" },
  { id: "character-a", kind: "character", prompt: `${STYLE_PREFIX}, isolated full-body forest pathfinder, calm watchful stance, readable silhouette, transparent background`, negativePrompt: `${NEGATIVE}, scenery, ground, cast shadow, cropped body`, resolution: "512x768", removeBackground: true, promptVersion: "forest-style-1" },
  { id: "character-b", kind: "character", prompt: `${STYLE_PREFIX}, isolated full-body lantern keeper, curious alert stance, readable silhouette, transparent background`, negativePrompt: `${NEGATIVE}, scenery, ground, cast shadow, cropped body`, resolution: "512x768", removeBackground: true, promptVersion: "forest-style-1" },
  { id: "foreground-branches", kind: "foreground", prompt: `${STYLE_PREFIX}, isolated translucent leafy branches framing the edge, transparent background`, negativePrompt: `${NEGATIVE}, scenery, horizon, cast shadow`, resolution: "512x512", removeBackground: true, promptVersion: "forest-style-1" },
];
