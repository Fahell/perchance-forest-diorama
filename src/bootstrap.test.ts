import { describe, expect, it } from "vitest";
import { getOrCreateAppRoot } from "./bootstrap";

describe("getOrCreateAppRoot", () => {
  it("uses the existing local #app host", () => {
    document.body.innerHTML = '<div id="app" data-forest-diorama-root="true"></div>';
    const root = getOrCreateAppRoot(document);
    expect(root?.id).toBe("app");
    expect(document.querySelectorAll("[data-forest-diorama-root]")).toHaveLength(1);
  });

  it("creates an isolated host when embedded without #app", () => {
    document.body.innerHTML = "<p>Perchance host content</p>";
    const root = getOrCreateAppRoot(document);
    expect(root?.dataset.forestDioramaRoot).toBe("true");
    expect(document.body.textContent).toContain("Perchance host content");
  });

  it("reuses the embed host", () => {
    document.body.innerHTML = '<div data-forest-diorama-root="true"></div>';
    const first = getOrCreateAppRoot(document);
    const second = getOrCreateAppRoot(document);
    expect(second).toBe(first);
    expect(document.querySelectorAll("[data-forest-diorama-root]")).toHaveLength(1);
  });
});
