const ROOT_SELECTOR = "[data-forest-diorama-root]";
const STYLE_SELECTOR = "[data-forest-diorama-style]";
const CLEANUP_KEY = "__forestDioramaCleanup__";
const PAGEHIDE_KEY = "__forestDioramaPagehide__";
const MAX_MOUNT_RETRIES = 120;

type HostWithLifecycle = HTMLElement & {
  [CLEANUP_KEY]?: () => void;
  [PAGEHIDE_KEY]?: () => void;
};

export function getOrCreateAppRoot(documentRef: Document): HTMLElement | null {
  const existingRoot = documentRef.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (existingRoot) return existingRoot;

  if (!documentRef.body) return null;
  const host = documentRef.createElement("div");
  host.dataset.forestDioramaRoot = "true";
  documentRef.body.append(host);
  return host;
}

export function installAppCleanup(host: HTMLElement, cleanup: () => void, pagehideHandler: () => void): void {
  const typedHost = host as HostWithLifecycle;
  if (typedHost[PAGEHIDE_KEY]) window.removeEventListener("pagehide", typedHost[PAGEHIDE_KEY]);
  typedHost[CLEANUP_KEY]?.();
  typedHost[CLEANUP_KEY] = cleanup;
  typedHost[PAGEHIDE_KEY] = pagehideHandler;
}

export function removeAppStyle(documentRef: Document): void {
  documentRef.querySelectorAll(STYLE_SELECTOR).forEach((style) => style.remove());
}

export function markAppStyle(style: HTMLStyleElement): void {
  style.dataset.forestDioramaStyle = "true";
}

export { MAX_MOUNT_RETRIES };
