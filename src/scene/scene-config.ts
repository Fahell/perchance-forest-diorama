export type SceneLayer = "far" | "mid" | "play" | "foreground";
export type SceneEntity = {
  id: string;
  layer: SceneLayer;
  position: { x: number; y: number; z: number };
  scale: number;
  anchor: { x: number; y: number };
  interactive?: boolean;
  characterId?: string;
};

export const SCENE_ENTITIES: readonly SceneEntity[] = [
  { id: "forest-background", layer: "far", position: { x: 0, y: 0, z: -8 }, scale: 1, anchor: { x: 0.5, y: 0.5 } },
  { id: "forest-prop-left", layer: "mid", position: { x: -3.2, y: -1.4, z: -2 }, scale: 1.2, anchor: { x: 0.5, y: 0 } },
  { id: "player-avatar", layer: "play", position: { x: -1.4, y: -1.4, z: 1 }, scale: 1, anchor: { x: 0.5, y: 0 }, characterId: "player" },
  { id: "character-a", layer: "play", position: { x: 0.8, y: -1.4, z: 1.1 }, scale: 1, anchor: { x: 0.5, y: 0 }, characterId: "character-a" },
  { id: "character-b", layer: "play", position: { x: 2.8, y: -1.4, z: 1.2 }, scale: 1, anchor: { x: 0.5, y: 0 }, characterId: "character-b" },
  { id: "foreground-branches", layer: "foreground", position: { x: 0, y: 0, z: 4 }, scale: 1, anchor: { x: 0.5, y: 0.5 } },
];
