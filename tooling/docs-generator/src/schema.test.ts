import { describe, it, expectTypeOf } from "vitest";
import type {
  PropMeta,
  ComponentMeta,
  CompoundComponentMeta,
  PackageDocMeta,
  GeneratorOutput,
} from "./schema";

describe("docs-generator: metadata schema", () => {
  it("PropMeta has required fields", () => {
    expectTypeOf<PropMeta>().toHaveProperty("name");
    expectTypeOf<PropMeta>().toHaveProperty("type");
    expectTypeOf<PropMeta>().toHaveProperty("required");
    expectTypeOf<PropMeta>().toHaveProperty("defaultValue");
    expectTypeOf<PropMeta>().toHaveProperty("description");
    expectTypeOf<PropMeta>().toHaveProperty("deprecated");
  });

  it("PropMeta types are correct", () => {
    expectTypeOf<PropMeta["name"]>().toEqualTypeOf<string>();
    expectTypeOf<PropMeta["type"]>().toEqualTypeOf<string>();
    expectTypeOf<PropMeta["required"]>().toEqualTypeOf<boolean>();
    expectTypeOf<PropMeta["defaultValue"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PropMeta["description"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PropMeta["deprecated"]>().toEqualTypeOf<boolean>();
  });

  it("ComponentMeta has required fields", () => {
    expectTypeOf<ComponentMeta>().toHaveProperty("name");
    expectTypeOf<ComponentMeta>().toHaveProperty("packagePath");
    expectTypeOf<ComponentMeta>().toHaveProperty("propsInterface");
    expectTypeOf<ComponentMeta>().toHaveProperty("props");
    expectTypeOf<ComponentMeta>().toHaveProperty("description");
    expectTypeOf<ComponentMeta>().toHaveProperty("sourceFile");
  });

  it("ComponentMeta.props is readonly PropMeta array", () => {
    expectTypeOf<ComponentMeta["props"]>().toExtend<readonly PropMeta[]>();
  });

  it("CompoundComponentMeta groups parts", () => {
    expectTypeOf<CompoundComponentMeta>().toHaveProperty("name");
    expectTypeOf<CompoundComponentMeta>().toHaveProperty("packagePath");
    expectTypeOf<CompoundComponentMeta>().toHaveProperty("parts");
    expectTypeOf<CompoundComponentMeta["parts"]>().toExtend<readonly ComponentMeta[]>();
  });

  it("PackageDocMeta has package info and components", () => {
    expectTypeOf<PackageDocMeta>().toHaveProperty("packageName");
    expectTypeOf<PackageDocMeta>().toHaveProperty("entryPoint");
    expectTypeOf<PackageDocMeta>().toHaveProperty("components");
  });

  it("GeneratorOutput has timestamp, version, and packages", () => {
    expectTypeOf<GeneratorOutput>().toHaveProperty("generatedAt");
    expectTypeOf<GeneratorOutput>().toHaveProperty("generatorVersion");
    expectTypeOf<GeneratorOutput>().toHaveProperty("packages");
    expectTypeOf<GeneratorOutput["generatedAt"]>().toEqualTypeOf<string>();
  });

  it("metadata is fully readonly (immutable contract)", () => {
    type WritableProps = { -readonly [K in keyof PropMeta]: PropMeta[K] };
    // PropMeta properties should be readonly
    expectTypeOf<PropMeta>().not.toEqualTypeOf<WritableProps>();
  });
});
