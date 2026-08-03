export type PluginName = "ai" | "image";
export type PluginFunction = ((...args: unknown[]) => unknown) & Record<string, unknown>;
export type RootLike = PluginFunction | Record<string, unknown>;

export type BridgeLookup = {
  root: RootLike | null;
  source: "window" | "parent" | "missing";
  error?: string;
};

export type BridgeStatus = BridgeLookup & {
  ai: boolean;
  image: boolean;
};

declare global {
  interface Window {
    root?: RootLike;
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRootLike(value: unknown): value is RootLike {
  return typeof value === "function" || (typeof value === "object" && value !== null);
}

/** Resolves the host bridge only when called; Perchance may initialize it after module evaluation. */
export function resolvePerchanceRoot(): BridgeLookup {
  try {
    const localRoot = window.root;
    if (isRootLike(localRoot)) return { root: localRoot, source: "window" };
  } catch (error) {
    return { root: null, source: "missing", error: `window.root unavailable: ${describeError(error)}` };
  }

  try {
    if (window.parent !== window) {
      const parentRoot = window.parent.root;
      if (isRootLike(parentRoot)) return { root: parentRoot, source: "parent" };
    }
  } catch (error) {
    return { root: null, source: "missing", error: `parent.root unavailable: ${describeError(error)}` };
  }

  return { root: null, source: "missing", error: "No Perchance root found in this context." };
}

export function inspectBridge(): BridgeStatus {
  const lookup = resolvePerchanceRoot();
  if (!lookup.root) return { ...lookup, ai: false, image: false };

  try {
    return {
      ...lookup,
      ai: typeof lookup.root.ai === "function",
      image: typeof lookup.root.image === "function",
    };
  } catch (error) {
    return { ...lookup, ai: false, image: false, error: describeError(error) };
  }
}

export function getPlugin(name: PluginName): PluginFunction | null {
  const { root } = resolvePerchanceRoot();
  if (!root) return null;

  try {
    const candidate = root[name];
    return typeof candidate === "function" ? candidate.bind(root) as PluginFunction : null;
  } catch {
    return null;
  }
}
