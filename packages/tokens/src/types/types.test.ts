/**
 * Compile-time type tests for token contracts.
 *
 * These tests verify that the type system correctly catches invalid token
 * definitions at compile time. If this file compiles, the types work correctly.
 * Runtime assertions confirm the type tests are meaningful.
 */

import { describe, it, expect } from "vitest";
import type {
  PrimitiveTokens,
  SemanticTokens,
  ThemeName,
  DensityName,
  InteractionState,
  ColorScale,
  ColorScaleStep,
  TokenRef,
  PrimitiveRef,
  SemanticRef,
  LiteralRef,
  ComponentTokens,
  ThemeDefinition,
  ValidationError,
  ValidationResult,
} from "./index";
import { literal, primitiveRef, semanticRef } from "./index";

describe("Token type contracts — compile-time validation", () => {
  describe("value factory functions", () => {
    it("creates literal references", () => {
      const ref = literal("#ffffff");
      expect(ref.kind).toBe("literal");
      expect(ref.value).toBe("#ffffff");
    });

    it("creates primitive references", () => {
      const ref = primitiveRef("color.blue.500");
      expect(ref.kind).toBe("primitive");
      expect(ref.path).toBe("color.blue.500");
    });

    it("creates semantic references", () => {
      const ref = semanticRef("color.background.page");
      expect(ref.kind).toBe("semantic");
      expect(ref.path).toBe("color.background.page");
    });
  });

  describe("ThemeName constraint", () => {
    it("accepts valid theme names", () => {
      const light: ThemeName = "light";
      const dark: ThemeName = "dark";
      expect(light).toBe("light");
      expect(dark).toBe("dark");
    });
  });

  describe("DensityName constraint", () => {
    it("accepts valid density names", () => {
      const comfortable: DensityName = "comfortable";
      const compact: DensityName = "compact";
      const spacious: DensityName = "spacious";
      expect(comfortable).toBe("comfortable");
      expect(compact).toBe("compact");
      expect(spacious).toBe("spacious");
    });
  });

  describe("InteractionState constraint", () => {
    it("includes all approved states", () => {
      const states: InteractionState[] = [
        "default",
        "hover",
        "active",
        "focus",
        "selected",
        "disabled",
        "readOnly",
        "loading",
        "invalid",
        "valid",
        "dragging",
      ];
      expect(states).toHaveLength(11);
    });
  });

  describe("ColorScaleStep constraint", () => {
    it("includes all standard steps", () => {
      const steps: ColorScaleStep[] = [
        "50",
        "100",
        "200",
        "300",
        "400",
        "500",
        "600",
        "700",
        "800",
        "900",
        "950",
      ];
      expect(steps).toHaveLength(11);
    });
  });

  describe("TokenRef discriminated union", () => {
    it("narrows on kind", () => {
      const refs: TokenRef[] = [
        literal("#000"),
        primitiveRef("color.blue.500"),
        semanticRef("color.text.primary"),
      ];

      for (const ref of refs) {
        switch (ref.kind) {
          case "literal": {
            const _literalRef: LiteralRef = ref;
            expect(_literalRef.value).toBeDefined();
            break;
          }
          case "primitive": {
            const _primRef: PrimitiveRef = ref;
            expect(_primRef.path).toBeDefined();
            break;
          }
          case "semantic": {
            const _semRef: SemanticRef = ref;
            expect(_semRef.path).toBeDefined();
            break;
          }
          case "component":
            break;
        }
      }
    });
  });

  describe("PrimitiveTokens shape", () => {
    it("requires all categories", () => {
      // Type-level assertion: if PrimitiveTokens is missing a category,
      // this would fail to compile.
      type RequiredCategories = keyof PrimitiveTokens;
      const categories: RequiredCategories[] = [
        "color",
        "spacing",
        "fontSize",
        "fontWeight",
        "fontFamily",
        "lineHeight",
        "letterSpacing",
        "radius",
        "shadow",
        "duration",
        "easing",
        "zIndex",
        "opacity",
        "breakpoint",
      ];
      expect(categories).toHaveLength(14);
    });
  });

  describe("SemanticTokens shape", () => {
    it("requires all top-level groups", () => {
      type RequiredGroups = keyof SemanticTokens;
      const groups: RequiredGroups[] = ["color", "spacing", "control", "elevation"];
      expect(groups).toHaveLength(4);
    });
  });

  describe("ComponentTokens shape", () => {
    it("requires initial component contracts", () => {
      type RequiredComponents = keyof ComponentTokens;
      const components: RequiredComponents[] = ["button", "input", "dialog", "tab"];
      expect(components).toHaveLength(4);
    });
  });

  describe("ColorScale completeness", () => {
    it("requires all 11 steps", () => {
      // A valid ColorScale must have all steps defined
      const mockScale: ColorScale = {
        "50": "#fafafa",
        "100": "#f4f4f5",
        "200": "#e4e4e7",
        "300": "#d4d4d8",
        "400": "#a1a1aa",
        "500": "#71717a",
        "600": "#52525b",
        "700": "#3f3f46",
        "800": "#27272a",
        "900": "#18181b",
        "950": "#09090b",
      };
      expect(Object.keys(mockScale)).toHaveLength(11);
    });
  });

  describe("ThemeDefinition structure", () => {
    it("maps semantic token structure to TokenRef leaves", () => {
      // Verify a partial theme definition compiles correctly
      const partialDef: Pick<ThemeDefinition, "color"> = {
        color: {
          background: {
            page: primitiveRef("color.white"),
            surface: primitiveRef("color.neutral.50"),
            elevated: primitiveRef("color.white"),
            sunken: primitiveRef("color.neutral.100"),
            overlay: literal("rgba(0, 0, 0, 0.5)"),
          },
          text: {
            primary: primitiveRef("color.neutral.900"),
            secondary: primitiveRef("color.neutral.600"),
            tertiary: primitiveRef("color.neutral.500"),
            disabled: primitiveRef("color.neutral.400"),
            inverse: primitiveRef("color.white"),
            link: primitiveRef("color.blue.600"),
          },
          border: {
            default: primitiveRef("color.neutral.200"),
            subtle: primitiveRef("color.neutral.100"),
            strong: primitiveRef("color.neutral.400"),
            interactive: primitiveRef("color.blue.500"),
            focus: primitiveRef("color.blue.500"),
            disabled: primitiveRef("color.neutral.200"),
          },
          interactive: {
            default: primitiveRef("color.blue.600"),
            hover: primitiveRef("color.blue.700"),
            active: primitiveRef("color.blue.800"),
            selected: primitiveRef("color.blue.100"),
            subtle: primitiveRef("color.blue.50"),
            subtleHover: primitiveRef("color.blue.100"),
          },
          status: {
            success: primitiveRef("color.green.600"),
            successSubtle: primitiveRef("color.green.50"),
            warning: primitiveRef("color.orange.500"),
            warningSubtle: primitiveRef("color.orange.50"),
            error: primitiveRef("color.red.600"),
            errorSubtle: primitiveRef("color.red.50"),
            info: primitiveRef("color.blue.600"),
            infoSubtle: primitiveRef("color.blue.50"),
          },
          focus: {
            ring: primitiveRef("color.blue.500"),
            innerRing: primitiveRef("color.white"),
          },
          destructive: {
            default: primitiveRef("color.red.600"),
            hover: primitiveRef("color.red.700"),
            active: primitiveRef("color.red.800"),
            subtle: primitiveRef("color.red.50"),
            text: primitiveRef("color.white"),
          },
        },
      };
      expect(partialDef.color.background.page.kind).toBe("primitive");
    });
  });

  describe("ValidationResult structure", () => {
    it("accepts valid result shapes", () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        tokenCount: 100,
        resolvedCount: 100,
      };
      expect(result.valid).toBe(true);
    });

    it("accepts error entries", () => {
      const error: ValidationError = {
        code: "MISSING_REQUIRED_TOKEN",
        severity: "error",
        path: "color.background.page",
        message: "Required token is missing",
        expected: "ColorValue",
      };
      expect(error.code).toBe("MISSING_REQUIRED_TOKEN");
    });
  });
});
