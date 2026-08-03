import styles from "./styles.css?inline";

const styleElement = document.createElement("style");
styleElement.textContent = styles;
document.head.append(styleElement);
import { mountApp } from "./ui/app-shell";

declare const __BUILD_COMMIT__: string;

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Application root #app was not found.");

const cleanup = mountApp(root, __BUILD_COMMIT__);
window.addEventListener("pagehide", cleanup, { once: true });
