import { describe, it, expect } from "vitest";
import { computePosition, computeArrowPosition } from "./floating-position";
import type { ComputePositionInput } from "./floating-position";
import type { DOMRectLike } from "@kairoui/utils/dom";

const viewport: DOMRectLike = {
  top: 0,
  left: 0,
  right: 1000,
  bottom: 800,
  width: 1000,
  height: 800,
};
const anchor: DOMRectLike = {
  top: 400,
  left: 400,
  right: 500,
  bottom: 440,
  width: 100,
  height: 40,
};
const floatingRect = { width: 200, height: 100 };

function pos(overrides: Partial<ComputePositionInput> = {}): ComputePositionInput {
  return {
    anchorRect: anchor,
    floatingRect,
    viewportRect: viewport,
    options: {},
    ...overrides,
  };
}

// ─── Basic placement ────────────────────────────────────────────────

describe("computePosition: placement", () => {
  it("positions below anchor by default (bottom)", () => {
    const result = computePosition(pos());
    expect(result.placement).toBe("bottom");
    expect(result.y).toBe(440); // anchor.bottom + 0 offset
    expect(result.x).toBe(350); // anchor center (450) - floating/2 (100)
  });

  it("positions above anchor (top)", () => {
    const result = computePosition(pos({ options: { placement: "top" } }));
    expect(result.placement).toBe("top");
    expect(result.y).toBe(300); // anchor.top - floating.height
    expect(result.x).toBe(350);
  });

  it("positions to the left (left)", () => {
    const result = computePosition(pos({ options: { placement: "left" } }));
    expect(result.placement).toBe("left");
    expect(result.x).toBe(200); // anchor.left - floating.width
    expect(result.y).toBe(370); // anchor center Y (420) - floating.height/2 (50)
  });

  it("positions to the right (right)", () => {
    const result = computePosition(pos({ options: { placement: "right" } }));
    expect(result.placement).toBe("right");
    expect(result.x).toBe(500); // anchor.right
    expect(result.y).toBe(370);
  });
});

// ─── Alignment ──────────────────────────────────────────────────────

describe("computePosition: alignment", () => {
  it("aligns to start (bottom-start)", () => {
    const result = computePosition(pos({ options: { placement: "bottom-start" } }));
    expect(result.x).toBe(400); // anchor.left
  });

  it("aligns to end (bottom-end)", () => {
    const result = computePosition(pos({ options: { placement: "bottom-end" } }));
    expect(result.x).toBe(300); // anchor.right - floating.width
  });

  it("aligns vertically for left/right (right-start)", () => {
    const result = computePosition(pos({ options: { placement: "right-start" } }));
    expect(result.y).toBe(400); // anchor.top
  });

  it("aligns vertically for left/right (left-end)", () => {
    const result = computePosition(pos({ options: { placement: "left-end" } }));
    expect(result.y).toBe(340); // anchor.bottom - floating.height
  });
});

// ─── Offset ─────────────────────────────────────────────────────────

describe("computePosition: offset", () => {
  it("applies offset from anchor", () => {
    const result = computePosition(pos({ options: { placement: "bottom", offset: 8 } }));
    expect(result.y).toBe(448); // anchor.bottom + 8
  });

  it("applies offset for top placement", () => {
    const result = computePosition(pos({ options: { placement: "top", offset: 4 } }));
    expect(result.y).toBe(296); // anchor.top - floating.height - 4
  });
});

// ─── Flip ───────────────────────────────────────────────────────────

describe("computePosition: flip", () => {
  it("flips from bottom to top when overflowing bottom", () => {
    const nearBottom: DOMRectLike = {
      top: 750,
      left: 400,
      right: 500,
      bottom: 790,
      width: 100,
      height: 40,
    };
    const result = computePosition(pos({ anchorRect: nearBottom }));
    expect(result.placement).toBe("top");
    expect(result.y).toBe(650); // nearBottom.top - floating.height
  });

  it("flips from top to bottom when overflowing top", () => {
    const nearTop: DOMRectLike = {
      top: 10,
      left: 400,
      right: 500,
      bottom: 50,
      width: 100,
      height: 40,
    };
    const result = computePosition(pos({ anchorRect: nearTop, options: { placement: "top" } }));
    expect(result.placement).toBe("bottom");
    expect(result.y).toBe(50);
  });

  it("flips from right to left when overflowing right", () => {
    const nearRight: DOMRectLike = {
      top: 400,
      left: 900,
      right: 990,
      bottom: 440,
      width: 90,
      height: 40,
    };
    const result = computePosition(pos({ anchorRect: nearRight, options: { placement: "right" } }));
    expect(result.placement).toBe("left");
  });

  it("does not flip when flip is disabled", () => {
    const nearBottom: DOMRectLike = {
      top: 750,
      left: 400,
      right: 500,
      bottom: 790,
      width: 100,
      height: 40,
    };
    const result = computePosition(pos({ anchorRect: nearBottom, options: { flip: false } }));
    expect(result.placement).toBe("bottom");
  });

  it("does not flip if flipped side also overflows", () => {
    // Tiny viewport where both top and bottom overflow
    const smallViewport: DOMRectLike = {
      top: 0,
      left: 0,
      right: 1000,
      bottom: 150,
      width: 1000,
      height: 150,
    };
    const midAnchor: DOMRectLike = {
      top: 60,
      left: 400,
      right: 500,
      bottom: 90,
      width: 100,
      height: 30,
    };
    const result = computePosition(
      pos({
        anchorRect: midAnchor,
        viewportRect: smallViewport,
        options: { placement: "bottom" },
      }),
    );
    // Stays bottom since flipped (top) also overflows
    expect(result.placement).toBe("bottom");
  });
});

// ─── Shift ──────────────────────────────────────────────────────────

describe("computePosition: shift", () => {
  it("shifts horizontally to stay in viewport (bottom placement)", () => {
    const nearEdge: DOMRectLike = {
      top: 400,
      left: 5,
      right: 50,
      bottom: 440,
      width: 45,
      height: 40,
    };
    const result = computePosition(pos({ anchorRect: nearEdge, options: { placement: "bottom" } }));
    expect(result.x).toBeGreaterThanOrEqual(0);
  });

  it("shifts vertically to stay in viewport (right placement)", () => {
    const nearTop: DOMRectLike = {
      top: 5,
      left: 400,
      right: 500,
      bottom: 45,
      width: 100,
      height: 40,
    };
    const result = computePosition(pos({ anchorRect: nearTop, options: { placement: "right" } }));
    expect(result.y).toBeGreaterThanOrEqual(0);
  });

  it("does not shift when shift is disabled", () => {
    const nearEdge: DOMRectLike = {
      top: 400,
      left: 5,
      right: 50,
      bottom: 440,
      width: 45,
      height: 40,
    };
    const result = computePosition(
      pos({ anchorRect: nearEdge, options: { placement: "bottom", shift: false } }),
    );
    // Without shift, x could be negative
    expect(result.x).toBeLessThan(0);
  });

  it("respects collisionPadding", () => {
    const nearEdge: DOMRectLike = {
      top: 400,
      left: 5,
      right: 50,
      bottom: 440,
      width: 45,
      height: 40,
    };
    const result = computePosition(
      pos({
        anchorRect: nearEdge,
        options: { placement: "bottom", collisionPadding: 10 },
      }),
    );
    expect(result.x).toBeGreaterThanOrEqual(10);
  });
});

// ─── RTL ────────────────────────────────────────────────────────────

describe("computePosition: RTL", () => {
  it("mirrors start alignment in RTL (bottom-start becomes right-aligned)", () => {
    const result = computePosition(pos({ options: { placement: "bottom-start" }, isRtl: true }));
    // In RTL, "start" aligns to the right edge of anchor
    expect(result.x).toBe(300); // anchor.right - floating.width
  });

  it("mirrors end alignment in RTL (bottom-end becomes left-aligned)", () => {
    const result = computePosition(pos({ options: { placement: "bottom-end" }, isRtl: true }));
    expect(result.x).toBe(400); // anchor.left
  });
});

// ─── Transform origin ───────────────────────────────────────────────

describe("computePosition: transformOrigin", () => {
  it("returns correct origin for bottom placement", () => {
    const result = computePosition(pos({ options: { placement: "bottom" } }));
    expect(result.transformOrigin).toBe("center top");
  });

  it("returns correct origin for top-start placement", () => {
    const result = computePosition(pos({ options: { placement: "top-start" } }));
    expect(result.transformOrigin).toBe("left bottom");
  });

  it("returns correct origin for right-end placement", () => {
    const result = computePosition(pos({ options: { placement: "right-end" } }));
    expect(result.transformOrigin).toBe("left bottom");
  });
});

// ─── Arrow position ─────────────────────────────────────────────────

describe("computeArrowPosition", () => {
  it("computes horizontal arrow position for bottom placement", () => {
    const result = computeArrowPosition({
      anchorRect: anchor,
      floatingX: 350,
      floatingY: 440,
      floatingSize: floatingRect,
      arrowSize: 10,
      placement: "bottom",
    });
    expect(result.x).toBeDefined();
    expect(result.y).toBeUndefined();
    // Arrow points at anchor center: 450 - 350 (floatingX) - 5 (half arrow) = 95
    expect(result.x).toBe(95);
  });

  it("computes vertical arrow position for right placement", () => {
    const result = computeArrowPosition({
      anchorRect: anchor,
      floatingX: 500,
      floatingY: 370,
      floatingSize: floatingRect,
      arrowSize: 10,
      placement: "right",
    });
    expect(result.y).toBeDefined();
    expect(result.x).toBeUndefined();
    // Arrow points at anchor center Y: 420 - 370 (floatingY) - 5 (half) = 45
    expect(result.y).toBe(45);
  });

  it("clamps arrow within floating element bounds", () => {
    // Shifted floating so arrow would be out of bounds
    const result = computeArrowPosition({
      anchorRect: { top: 400, left: 0, right: 20, bottom: 440, width: 20, height: 40 },
      floatingX: 0,
      floatingY: 440,
      floatingSize: floatingRect,
      arrowSize: 10,
      placement: "bottom",
      collisionPadding: 4,
    });
    // Should be clamped to minPad (4 + 5 = 9)
    expect(result.x).toBeGreaterThanOrEqual(9);
  });
});
