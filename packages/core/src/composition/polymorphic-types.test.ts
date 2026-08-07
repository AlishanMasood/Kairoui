import { describe, it, expectTypeOf } from "vitest";
import type {
  PolymorphicProps,
  PolymorphicRef,
  PolymorphicComponent,
  PropsOf,
  NativePolymorphicProps,
} from "./polymorphic-types";

// Test component own props
interface ButtonOwnProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

describe("Polymorphic type system", () => {
  describe("PropsOf", () => {
    it("extracts props for native elements", () => {
      type ButtonProps = PropsOf<"button">;
      expectTypeOf<ButtonProps>().toHaveProperty("onClick");
      expectTypeOf<ButtonProps>().toHaveProperty("disabled");
      expectTypeOf<ButtonProps>().toHaveProperty("type");
    });

    it("extracts props for anchor elements", () => {
      type AnchorProps = PropsOf<"a">;
      expectTypeOf<AnchorProps>().toHaveProperty("href");
      expectTypeOf<AnchorProps>().toHaveProperty("target");
    });
  });

  describe("PolymorphicProps", () => {
    it("includes own props", () => {
      type Props = PolymorphicProps<ButtonOwnProps, "button">;
      expectTypeOf<Props>().toHaveProperty("variant");
      expectTypeOf<Props>().toHaveProperty("size");
    });

    it("includes native element props", () => {
      type Props = PolymorphicProps<ButtonOwnProps, "button">;
      expectTypeOf<Props>().toHaveProperty("disabled");
      expectTypeOf<Props>().toHaveProperty("type");
    });

    it("includes as prop", () => {
      type Props = PolymorphicProps<ButtonOwnProps, "button">;
      expectTypeOf<Props>().toHaveProperty("as");
    });

    it("changes native props when as changes", () => {
      type AsAnchor = PolymorphicProps<ButtonOwnProps, "a">;
      expectTypeOf<AsAnchor>().toHaveProperty("href");
    });

    it("own props take precedence over native props", () => {
      interface CustomProps {
        disabled: string;
      } // override native disabled type
      type Props = PolymorphicProps<CustomProps, "button">;
      expectTypeOf<Props["disabled"]>().toEqualTypeOf<string>();
    });
  });

  describe("PolymorphicRef", () => {
    it("infers ref type for button", () => {
      type Ref = PolymorphicRef<"button">;
      // Ref should be assignable (not void/never)
      expectTypeOf<Ref>().not.toBeNever();
    });

    it("infers ref type for anchor", () => {
      type Ref = PolymorphicRef<"a">;
      expectTypeOf<Ref>().not.toBeNever();
    });
  });

  describe("PolymorphicComponent", () => {
    it("is callable with default element props", () => {
      type Comp = PolymorphicComponent<ButtonOwnProps, "button">;
      expectTypeOf<Comp>().toBeCallableWith({
        variant: "primary",
        disabled: true,
      });
    });

    it("accepts as prop to change element", () => {
      type Comp = PolymorphicComponent<ButtonOwnProps, "button">;
      expectTypeOf<Comp>().toBeCallableWith({
        as: "a" as const,
        variant: "primary",
        href: "/",
      });
    });
  });

  describe("NativePolymorphicProps", () => {
    it("constrains to intrinsic elements only", () => {
      type Props = NativePolymorphicProps<ButtonOwnProps, "div">;
      expectTypeOf<Props>().toHaveProperty("variant");
      expectTypeOf<Props>().toHaveProperty("as");
    });

    it("includes native props for the element", () => {
      type Props = NativePolymorphicProps<ButtonOwnProps, "input">;
      expectTypeOf<Props>().toHaveProperty("type");
      expectTypeOf<Props>().toHaveProperty("placeholder");
    });
  });
});
