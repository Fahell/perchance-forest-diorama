import { inspectBridge, getPlugin } from "../bridge/perchance-root";
import { SCENE_VERSION } from "../assets/asset-manifest";
import { normalizeImageResult } from "../assets/asset-normalizer";
import { IndexedDbAssetCache } from "../assets/asset-cache";
import { SceneRuntime } from "../scene/scene-runtime";
import { NarrativeStateMachine } from "../narrative/state-machine";

const MODULE_URL = import.meta.url;
const IMAGE_PROBE_PROMPT = "A simple authorial fantasy forest trail at sunrise, no characters, no text, no watermark";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function setButtonBusy(button: HTMLButtonElement, busy: boolean, busyLabel: string, idleLabel: string): void {
  button.disabled = busy;
  button.textContent = busy ? busyLabel : idleLabel;
}

export function mountApp(root: HTMLElement, buildCommit: string): () => void {
  root.innerHTML = `
    <main class="app-shell">
      <header class="topbar"><div><p class="eyebrow">AUTHORIAL FOREST · PERCHANCE</p><h1>Lanterns on the Quiet Path</h1><p class="lede">Preview bridge readiness lab. Asset generation stays manual here so each expensive plugin call is observable.</p></div><span class="build">${escapeHtml(buildCommit.slice(0, 12))}</span></header>
      <section class="workspace">
        <div class="scene-panel"><div id="scene-canvas" class="scene-canvas" aria-label="Forest diorama placeholder"></div><div id="scene-note" class="scene-note">Scene runtime starting · ${SCENE_VERSION}</div></div>
        <aside class="side-panel">
          <div class="status-card"><h2>Bridge status</h2><div id="bridge-status"></div><div id="cache-status" class="cache-status"></div><p class="hint">The Preview must contain the two Lists imports before probes can run. No generation runs during boot.</p></div>
          <div class="probe-card"><div class="card-head"><h2>Manual probes</h2><span class="tag">explicit calls</span></div><p class="hint">These buttons may trigger Perchance verification, queueing and GPU work. Run one at a time and record the terminal result.</p><button id="probe-text" class="probe-button" type="button">Probe root.ai (text)</button><div id="probe-text-output" class="probe-output" aria-live="polite">Not run.</div><label>image invocation<select id="probe-image-mode"><option value="string">prompt string + options</option><option value="object">options object</option></select><label class="probe-check"><input id="probe-remove-background" type="checkbox"> include removeBackground (costly)</label><button id="probe-image" class="probe-button" type="button">Probe root.image (image)</button><div id="probe-image-output" class="probe-output" aria-live="polite">Not run.</div></div>
          <div class="story-card"><p class="eyebrow">NEXT TURN</p><h2>Choose an intention</h2><div class="intent-grid"><button disabled>Observe</button><button disabled>Ask</button><button disabled>Warn</button><button disabled>Comfort</button></div><textarea disabled placeholder="Narrative controls will be enabled after asset preparation."></textarea><button class="send" disabled>Send action</button></div>
        </aside>
      </section>
      <footer class="diagnostics"><span>state: waiting-for-intent</span><span>build: ${escapeHtml(buildCommit)}</span><span>module: ${escapeHtml(MODULE_URL)}</span><span>bridge: lazy resolution</span><span id="runtime-status">renderer: starting</span></footer>
    </main>`;

  const bridgeStatus = root.querySelector<HTMLElement>("#bridge-status");
  const cacheStatus = root.querySelector<HTMLElement>("#cache-status");
  const cache = new IndexedDbAssetCache();
  if (cacheStatus) cacheStatus.textContent = `cache: ${cache.status.available ? "IndexedDB available" : "unavailable"}; persistence=${cache.status.persistent ?? "unknown"}`;
  const runtimeStatus = root.querySelector<HTMLElement>("#runtime-status");
  const sceneNote = root.querySelector<HTMLElement>("#scene-note");
  const updateBridgeStatus = (): void => {
    const status = inspectBridge();
    if (bridgeStatus) {
      bridgeStatus.replaceChildren();
      const lines: Array<[string, boolean]> = [
        [`root ${status.root ? `available via ${status.source}` : "not available in local preview"}`, Boolean(status.root)],
        [`root.ai ${status.ai ? "callable" : "waiting for Lists import"}`, status.ai],
        [`root.image ${status.image ? "callable" : "waiting for Lists import"}`, status.image],
      ];
      for (const [text, ok] of lines) {
        const line = document.createElement("span");
        line.className = `status-line ${ok ? "ok" : "pending"}`;
        line.textContent = text;
        bridgeStatus.append(line);
      }
      if (status.error) {
        const error = document.createElement("small");
        error.className = "status-error";
        error.textContent = status.error;
        bridgeStatus.append(error);
      }
    }
  };

  const probeText = async (): Promise<void> => {
    const button = root.querySelector<HTMLButtonElement>("#probe-text");
    const output = root.querySelector<HTMLElement>("#probe-text-output");
    const plugin = getPlugin("ai");
    if (!button || !output) return;
    if (!plugin) {
      output.textContent = "Blocked: root.ai is not callable. Check Lists and bridge status.";
      return;
    }
    setButtonBusy(button, true, "Waiting for root.ai…", "Probe root.ai (text)");
    output.textContent = "Started. Waiting for verification/stream…";
    try {
      const result = await Promise.resolve(plugin({
        instruction: "Reply with exactly one short sentence proving that the Perchance text bridge works. Do not use markdown.",
        startWith: "Bridge result: ",
        hideStartWith: false,
        stopSequences: ["END_PROBE"],
        endButtons: "none",
        onStart: () => { output.textContent = "root.ai started; waiting for chunks…"; },
        onChunk: (data: unknown) => {
          if (typeof data === "object" && data !== null && "fullTextSoFar" in data && typeof data.fullTextSoFar === "string") output.textContent = data.fullTextSoFar;
        },
        onFinish: (data: unknown) => {
          if (typeof data === "object" && data !== null && "text" in data && typeof data.text === "string") output.textContent = data.text;
        },
      }));
      const text = typeof result === "string" ? result : typeof result === "object" && result !== null && "text" in result && typeof result.text === "string" ? result.text : String(result);
      output.textContent = `Resolved: ${text}`;
    } catch (error) {
      output.textContent = `Terminal error: ${describeError(error)}`;
    } finally {
      setButtonBusy(button, false, "Waiting for root.ai…", "Probe root.ai (text)");
    }
  };

  const probeImage = async (): Promise<void> => {
    const button = root.querySelector<HTMLButtonElement>("#probe-image");
    const output = root.querySelector<HTMLElement>("#probe-image-output");
    const mode = root.querySelector<HTMLSelectElement>("#probe-image-mode")?.value ?? "string";
    const removeBackground = root.querySelector<HTMLInputElement>("#probe-remove-background")?.checked ?? false;
    const plugin = getPlugin("image");
    if (!button || !output) return;
    if (!plugin) {
      output.textContent = "Blocked: root.image is not callable. Check Lists and bridge status.";
      return;
    }
    setButtonBusy(button, true, "Waiting for root.image…", "Probe root.image (image)");
    output.textContent = `Started with ${mode} invocation. Waiting for verification/GPU…`;
    try {
      const options = { negativePrompt: "text, watermark, logo, blurry", resolution: "512x512", seed: -1, guidanceScale: 7, hideGalleryButtons: true, ...(removeBackground ? { removeBackground: true } : {}) } as const;
      const result = mode === "string"
        ? await Promise.resolve(plugin(IMAGE_PROBE_PROMPT, options))
        : await Promise.resolve(plugin({ prompt: IMAGE_PROBE_PROMPT, ...options }));
      const normalized = await normalizeImageResult(result);
      const image = document.createElement("img");
      image.alt = "Manual Perchance image probe result";
      image.src = normalized.dataUrl;
      if (normalized.objectUrl) image.addEventListener("load", () => URL.revokeObjectURL(normalized.objectUrl!), { once: true });
      output.replaceChildren(image);
      const details = document.createElement("small");
      details.textContent = `Resolved: ${normalized.representation}; mime=${normalized.mimeType}; inputs=${JSON.stringify(normalized.inputs ?? "not exposed")}`;
      output.append(details);
    } catch (error) {
      output.textContent = `Terminal error: ${describeError(error)}`;
    } finally {
      setButtonBusy(button, false, "Waiting for root.image…", "Probe root.image (image)");
    }
  };

  root.querySelector<HTMLButtonElement>("#probe-text")?.addEventListener("click", () => void probeText());
  root.querySelector<HTMLButtonElement>("#probe-image")?.addEventListener("click", () => void probeImage());
  updateBridgeStatus();
  const bridgeTimer = window.setInterval(updateBridgeStatus, 1000);
  const updateRuntimeStatus = (status: string, error?: string): void => {
    if (runtimeStatus) runtimeStatus.textContent = `renderer: ${status}${error ? ` (${error})` : ""}`;
    if (sceneNote) sceneNote.textContent = `${status === "ready" ? "Scene runtime ready" : status === "context-lost" ? "WebGL context lost — waiting for recovery" : "Scene fallback active"} · ${SCENE_VERSION}`;
  };
  const runtime = new SceneRuntime(root.querySelector<HTMLElement>("#scene-canvas")!, updateRuntimeStatus);
  updateRuntimeStatus(runtime.status, runtime.error ?? undefined);
  const narrative = new NarrativeStateMachine();
  void narrative;

  return () => {
    window.clearInterval(bridgeTimer);
    runtime.dispose();
    cache.close();
  };
}
