import { afterEach, describe, expect, it } from "vitest";
import { getPlugin, inspectBridge } from "./perchance-root";

afterEach(() => {
  delete window.root;
});

describe("Perchance bridge", () => {
  it("reports a missing root without throwing", () => {
    expect(inspectBridge()).toMatchObject({ root: null, source: "missing", ai: false, image: false });
  });

  it("inspects callable plugins lazily", () => {
    window.root = {
      ai: () => "text",
      image: () => "image",
    };

    expect(inspectBridge()).toMatchObject({ source: "window", ai: true, image: true });
  });

  it("binds the root receiver when reading a plugin", () => {
    window.root = {
      marker: "bridge",
      ai(this: { marker: string }) {
        return this.marker;
      },
    };

    expect(getPlugin("ai")?.()).toBe("bridge");
  });
});
