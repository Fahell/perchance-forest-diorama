import styles from "./styles.css?inline";
import { getOrCreateAppRoot, installAppCleanup, markAppStyle, MAX_MOUNT_RETRIES, removeAppStyle } from "./bootstrap";
import { mountApp } from "./ui/app-shell";

declare const __BUILD_COMMIT__: string;

let mountAttempts = 0;
let mounted = false;

function mountWhenReady(): void {
  if (mounted) return;
  const root = getOrCreateAppRoot(document);
  if (!root || !document.head) {
    mountAttempts += 1;
    if (mountAttempts < MAX_MOUNT_RETRIES) window.setTimeout(mountWhenReady, 0);
    return;
  }

  mounted = true;
  removeAppStyle(document);
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  markAppStyle(styleElement);
  document.head.append(styleElement);

  const cleanup = mountApp(root, __BUILD_COMMIT__);
  const pagehideHandler = (): void => cleanup();
  installAppCleanup(root, cleanup, pagehideHandler);
  window.addEventListener("pagehide", pagehideHandler, { once: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountWhenReady, { once: true });
} else {
  mountWhenReady();
}
