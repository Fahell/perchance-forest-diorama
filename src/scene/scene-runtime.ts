import * as THREE from "three";

export type SceneRuntimeStatus = "ready" | "unavailable" | "context-lost";
export type SceneRuntimeStatusChange = (status: SceneRuntimeStatus, error?: string) => void;

export class SceneRuntime {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 100);
  readonly renderer: THREE.WebGLRenderer | null;
  readonly error: string | null;
  status: SceneRuntimeStatus;
  private readonly resizeObserver: ResizeObserver | null;
  private readonly onStatusChange?: SceneRuntimeStatusChange;
  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.status = "context-lost";
    this.onStatusChange?.(this.status);
  };
  private readonly onContextRestored = (): void => {
    if (this.renderer) {
      this.status = "ready";
      this.resize();
      this.onStatusChange?.(this.status);
    }
  };

  constructor(private readonly host: HTMLElement, onStatusChange?: SceneRuntimeStatusChange) {
    this.onStatusChange = onStatusChange;
    this.camera.position.z = 10;

    let resizeObserver: ResizeObserver | null = null;
    try {
      resizeObserver = new ResizeObserver(() => this.resize());
      resizeObserver.observe(host);
    } catch {
      window.addEventListener("resize", this.resize);
    }
    this.resizeObserver = resizeObserver;

    let renderer: THREE.WebGLRenderer | null = null;
    let error: string | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x101c25, 1);
      renderer.domElement.addEventListener("webglcontextlost", this.onContextLost, false);
      renderer.domElement.addEventListener("webglcontextrestored", this.onContextRestored, false);
      host.append(renderer.domElement);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
      const fallback = document.createElement("div");
      fallback.className = "scene-fallback";
      fallback.setAttribute("role", "status");
      fallback.textContent = "WebGL indisponível neste ambiente. A cena continuará com diagnóstico visível.";
      host.append(fallback);
    }

    this.renderer = renderer;
    this.error = error;
    this.status = renderer ? "ready" : "unavailable";
    this.resize();
  }

  resize = (): void => {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    const aspect = width / height;
    this.camera.left = -5 * aspect;
    this.camera.right = 5 * aspect;
    this.camera.updateProjectionMatrix();
    if (this.renderer) {
      this.renderer.setSize(width, height, false);
      this.renderer.render(this.scene, this.camera);
    }
  };

  dispose(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.resize);
    if (this.renderer) {
      this.renderer.domElement.removeEventListener("webglcontextlost", this.onContextLost);
      this.renderer.domElement.removeEventListener("webglcontextrestored", this.onContextRestored);
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    const disposedTextures = new Set<THREE.Texture>();
    const textureKeys = ["map", "alphaMap", "aoMap", "bumpMap", "displacementMap", "emissiveMap", "envMap", "lightMap", "metalnessMap", "normalMap", "roughnessMap"] as const;
    this.scene.traverse((object) => {
      const renderable = object as THREE.Mesh;
      if (renderable.geometry) renderable.geometry.dispose();
      const material = renderable.material;
      const materials = Array.isArray(material) ? material : material ? [material] : [];
      for (const item of materials) {
        const materialWithMaps = item as THREE.Material & Partial<Record<typeof textureKeys[number], THREE.Texture | null>>;
        for (const key of textureKeys) {
          const texture = materialWithMaps[key];
          if (texture && !disposedTextures.has(texture)) {
            disposedTextures.add(texture);
            texture.dispose();
          }
        }
        item.dispose();
      }
    });
  }
}
