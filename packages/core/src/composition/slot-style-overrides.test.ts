import { describe, it, expect, vi, afterEach } from "vitest";
import { applySlotOverride, applySlotOverrides } from "./slot-style-overrides";
import { defineSlots } from "./slot-definitions";
import type { ResolvedSlotStyle } from "./resolve-slot-styles";

afterEach(() => vi.restoreAllMocks());

// ─── Helpers ────────────────────────────────────────────────────────

function resolved(
  styles: Record<string, string> = {},
  classNames: string[] = [],
): ResolvedSlotStyle {
  return { styles, classNames };
}

// ─── applySlotOverride ──────────────────────────────────────────────

describe("applySlotOverride", () => {
  it("returns internal values when no consumer override", () => {
    const result = applySlotOverride(
      "kui-button__icon",
      resolved({ width: "16px" }),
      undefined,
      undefined,
    );
    expect(result.className).toBe("kui-button__icon");
    expect(result.style).toEqual({ width: "16px" });
  });

  it("merges consumer className", () => {
    const result = applySlotOverride("kui-button__icon", resolved(), "custom-icon", undefined);
    expect(result.className).toBe("kui-button__icon custom-icon");
  });

  it("merges consumer style per-property", () => {
    const result = applySlotOverride(
      undefined,
      resolved({ width: "16px", color: "red" }),
      undefined,
      { color: "blue", margin: "4px" },
    );
    expect(result.style).toEqual({ width: "16px", color: "blue", margin: "4px" });
  });

  it("includes variant class names in output", () => {
    const result = applySlotOverride(
      "kui-button__icon",
      resolved({}, ["kui-button__icon--sm"]),
      undefined,
      undefined,
    );
    expect(result.className).toContain("kui-button__icon");
    expect(result.className).toContain("kui-button__icon--sm");
  });

  it("combines internal + variant + consumer classNames", () => {
    const result = applySlotOverride(
      "kui-button__icon",
      resolved({}, ["kui-button__icon--lg"]),
      "my-icon",
      undefined,
    );
    expect(result.className).toContain("kui-button__icon");
    expect(result.className).toContain("kui-button__icon--lg");
    expect(result.className).toContain("my-icon");
  });
});

// ─── applySlotOverrides: public slots ───────────────────────────────

describe("applySlotOverrides: public slots", () => {
  const slots = defineSlots({
    root: { defaultElement: "button", required: true, public: true },
    startIcon: { defaultElement: "span", required: false, public: true },
    content: { defaultElement: "span", required: true, public: true },
    loadingIndicator: { defaultElement: "span", required: false, public: false },
  });

  const slotNames = ["root", "startIcon", "content", "loadingIndicator"] as const;

  it("applies consumer slotOverrides to public slots", () => {
    const result = applySlotOverrides(
      slotNames,
      slots,
      {
        root: resolved({ display: "flex" }),
        startIcon: resolved({ width: "16px" }),
        content: resolved(),
        loadingIndicator: resolved(),
      },
      {
        root: "kui-button",
        startIcon: "kui-button__start-icon",
        content: "kui-button__content",
      },
      {
        slotOverrides: {
          startIcon: { className: "my-icon", style: { color: "red" } },
        },
      },
      "Button",
    );

    expect(result.startIcon.className).toContain("my-icon");
    expect(result.startIcon.style?.["color"]).toBe("red");
  });

  it("root gets root-level className + style", () => {
    const result = applySlotOverrides(
      slotNames,
      slots,
      {
        root: resolved(),
        startIcon: resolved(),
        content: resolved(),
        loadingIndicator: resolved(),
      },
      { root: "kui-button" },
      {
        rootClassName: "consumer-root",
        rootStyle: { padding: "8px" },
      },
      "Button",
    );

    expect(result.root.className).toContain("consumer-root");
    expect(result.root.style?.["padding"]).toBe("8px");
  });

  it("root-level override does not leak to non-root slots", () => {
    const result = applySlotOverrides(
      slotNames,
      slots,
      {
        root: resolved(),
        startIcon: resolved(),
        content: resolved(),
        loadingIndicator: resolved(),
      },
      {},
      { rootClassName: "consumer-root" },
      "Button",
    );

    expect(result.startIcon.className ?? "").not.toContain("consumer-root");
    expect(result.content.className ?? "").not.toContain("consumer-root");
  });
});

// ─── applySlotOverrides: private slots ──────────────────────────────

describe("applySlotOverrides: private slots", () => {
  const slots = defineSlots({
    root: { defaultElement: "div", required: true, public: true },
    _internal: { defaultElement: "span", required: false, public: false },
  });

  it("warns when consumer overrides a private slot", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    applySlotOverrides(
      ["root", "_internal"] as const,
      slots,
      {
        root: resolved(),
        _internal: resolved({ display: "none" }),
      },
      {},
      {
        slotOverrides: {
          _internal: { className: "hacked", style: { display: "block" } },
        },
      },
      "Dialog",
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("internal"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("_internal"));
  });

  it("ignores consumer overrides for private slots", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = applySlotOverrides(
      ["root", "_internal"] as const,
      slots,
      {
        root: resolved(),
        _internal: resolved({ display: "none" }),
      },
      { _internal: "kui-dialog__internal" },
      {
        slotOverrides: {
          _internal: { className: "hacked", style: { display: "block" } },
        },
      },
      "Dialog",
    );

    // Consumer override ignored for private slot
    expect(result._internal.className).not.toContain("hacked");
    expect(result._internal.style?.["display"]).toBe("none"); // internal preserved
  });
});

// ─── Precedence ─────────────────────────────────────────────────────

describe("slot style overrides: precedence", () => {
  it("consumer style overrides internal per-property", () => {
    const result = applySlotOverride(
      undefined,
      resolved({ background: "var(--internal)", padding: "8px" }),
      undefined,
      { background: "purple" },
    );
    expect(result.style?.["background"]).toBe("purple");
    expect(result.style?.["padding"]).toBe("8px");
  });

  it("consumer className appends, never replaces", () => {
    const result = applySlotOverride(
      "kui-internal",
      resolved({}, ["kui-variant"]),
      "consumer",
      undefined,
    );
    expect(result.className).toContain("kui-internal");
    expect(result.className).toContain("kui-variant");
    expect(result.className).toContain("consumer");
  });

  it("does not mutate resolved input", () => {
    const res = resolved({ color: "red" });
    const before = JSON.stringify(res);
    applySlotOverride(undefined, res, "x", { color: "blue" });
    expect(JSON.stringify(res)).toBe(before);
  });
});
