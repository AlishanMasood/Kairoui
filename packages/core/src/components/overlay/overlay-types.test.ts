import { describe, it, expect, expectTypeOf } from "vitest";
import { createElement } from "react";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { OverlayStackContext, useOverlayStackContext } from "./overlay-types";
import type {
  Placement,
  Side,
  Alignment,
  OverlayMode,
  FloatingPositionOptions,
  DismissableLayerProps,
  FocusScopeProps,
  DialogProps,
  PopoverProps,
  TooltipProps,
  MenuProps,
  MenuItemProps,
  ToastPlacement,
  ToastProps,
  ProgressProps,
  SpinnerProps,
  SkeletonProps,
  OverlayStackContextValue,
} from "./overlay-types";

// ─── Placement types ────────────────────────────────────────────────

describe("Overlay types: Placement", () => {
  it("Placement includes all 12 positions", () => {
    const placements: Placement[] = [
      "top",
      "top-start",
      "top-end",
      "bottom",
      "bottom-start",
      "bottom-end",
      "left",
      "left-start",
      "left-end",
      "right",
      "right-start",
      "right-end",
    ];
    expect(placements).toHaveLength(12);
  });

  it("Side is a 4-value union", () => {
    expectTypeOf<Side>().toEqualTypeOf<"top" | "bottom" | "left" | "right">();
  });

  it("Alignment is a 3-value union", () => {
    expectTypeOf<Alignment>().toEqualTypeOf<"start" | "center" | "end">();
  });
});

// ─── Overlay mode ───────────────────────────────────────────────────

describe("Overlay types: OverlayMode", () => {
  it("is modal or non-modal", () => {
    expectTypeOf<OverlayMode>().toEqualTypeOf<"modal" | "non-modal">();
  });
});

// ─── FloatingPositionOptions ────────────────────────────────────────

describe("Overlay types: FloatingPositionOptions", () => {
  it("has placement/offset/flip/shift/collisionPadding", () => {
    expectTypeOf<FloatingPositionOptions>().toHaveProperty("placement");
    expectTypeOf<FloatingPositionOptions>().toHaveProperty("offset");
    expectTypeOf<FloatingPositionOptions>().toHaveProperty("flip");
    expectTypeOf<FloatingPositionOptions>().toHaveProperty("shift");
    expectTypeOf<FloatingPositionOptions>().toHaveProperty("collisionPadding");
  });

  it("all props are optional", () => {
    const opts: FloatingPositionOptions = {};
    expect(opts.placement).toBeUndefined();
  });
});

// ─── DismissableLayerProps ──────────────────────────────────────────

describe("Overlay types: DismissableLayerProps", () => {
  it("has onDismiss/onEscapeKeyDown/onPointerDownOutside", () => {
    expectTypeOf<DismissableLayerProps>().toHaveProperty("onDismiss");
    expectTypeOf<DismissableLayerProps>().toHaveProperty("onEscapeKeyDown");
    expectTypeOf<DismissableLayerProps>().toHaveProperty("onPointerDownOutside");
  });
});

// ─── FocusScopeProps ────────────────────────────────────────────────

describe("Overlay types: FocusScopeProps", () => {
  it("has trapped/restoreFocus/initialFocusRef", () => {
    expectTypeOf<FocusScopeProps>().toHaveProperty("trapped");
    expectTypeOf<FocusScopeProps>().toHaveProperty("restoreFocus");
    expectTypeOf<FocusScopeProps>().toHaveProperty("initialFocusRef");
  });
});

// ─── Dialog types ───────────────────────────────────────────────────

describe("Overlay types: Dialog", () => {
  it("has open/defaultOpen/onOpenChange/modal", () => {
    expectTypeOf<DialogProps>().toHaveProperty("open");
    expectTypeOf<DialogProps>().toHaveProperty("defaultOpen");
    expectTypeOf<DialogProps>().toHaveProperty("onOpenChange");
    expectTypeOf<DialogProps>().toHaveProperty("modal");
  });
});

// ─── Popover types ──────────────────────────────────────────────────

describe("Overlay types: Popover", () => {
  it("has open/onOpenChange/modal", () => {
    expectTypeOf<PopoverProps>().toHaveProperty("open");
    expectTypeOf<PopoverProps>().toHaveProperty("onOpenChange");
    expectTypeOf<PopoverProps>().toHaveProperty("modal");
  });
});

// ─── Tooltip types ──────────────────────────────────────────────────

describe("Overlay types: Tooltip", () => {
  it("has delayDuration/closeDelay", () => {
    expectTypeOf<TooltipProps>().toHaveProperty("delayDuration");
    expectTypeOf<TooltipProps>().toHaveProperty("closeDelay");
  });
});

// ─── Menu types ─────────────────────────────────────────────────────

describe("Overlay types: Menu", () => {
  it("MenuProps has open/onOpenChange", () => {
    expectTypeOf<MenuProps>().toHaveProperty("open");
    expectTypeOf<MenuProps>().toHaveProperty("onOpenChange");
  });

  it("MenuItemProps has onSelect/disabled", () => {
    expectTypeOf<MenuItemProps>().toHaveProperty("onSelect");
    expectTypeOf<MenuItemProps>().toHaveProperty("disabled");
  });
});

// ─── Toast types ────────────────────────────────────────────────────

describe("Overlay types: Toast", () => {
  it("has duration/placement", () => {
    expectTypeOf<ToastProps>().toHaveProperty("duration");
    expectTypeOf<ToastProps>().toHaveProperty("placement");
  });

  it("ToastPlacement is correct union", () => {
    expectTypeOf<ToastPlacement>().toEqualTypeOf<
      "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end"
    >();
  });
});

// ─── Feedback types ─────────────────────────────────────────────────

describe("Overlay types: Feedback", () => {
  it("ProgressProps has value/max/indeterminate", () => {
    expectTypeOf<ProgressProps>().toHaveProperty("value");
    expectTypeOf<ProgressProps>().toHaveProperty("max");
    expectTypeOf<ProgressProps>().toHaveProperty("indeterminate");
  });

  it("SpinnerProps has size/label", () => {
    expectTypeOf<SpinnerProps>().toHaveProperty("size");
    expectTypeOf<SpinnerProps>().toHaveProperty("label");
  });

  it("SkeletonProps has width/height/radius/animate", () => {
    expectTypeOf<SkeletonProps>().toHaveProperty("width");
    expectTypeOf<SkeletonProps>().toHaveProperty("height");
    expectTypeOf<SkeletonProps>().toHaveProperty("radius");
    expectTypeOf<SkeletonProps>().toHaveProperty("animate");
  });
});

// ─── OverlayStackContext ────────────────────────────────────────────

describe("OverlayStackContext", () => {
  it("returns null outside provider", () => {
    const { result } = renderHook(() => useOverlayStackContext());
    expect(result.current).toBeNull();
  });

  it("returns context inside provider", () => {
    const ctx: OverlayStackContextValue = {
      register: () => () => {},
      isTopmost: () => true,
    };
    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(OverlayStackContext.Provider, { value: ctx }, children);
    }
    Wrapper.displayName = "Wrapper";
    const { result } = renderHook(() => useOverlayStackContext(), { wrapper: Wrapper });
    expect(result.current).toBe(ctx);
  });
});

// ─── SSR safety ─────────────────────────────────────────────────────

describe("Overlay types: SSR", () => {
  it("OverlayStackContext.Provider renders on server", () => {
    const ctx: OverlayStackContextValue = {
      register: () => () => {},
      isTopmost: () => true,
    };
    const html = renderToString(
      createElement(OverlayStackContext.Provider, { value: ctx }, createElement("div", null, "ok")),
    );
    expect(html).toContain("ok");
  });
});
