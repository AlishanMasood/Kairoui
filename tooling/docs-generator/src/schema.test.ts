import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  PropMeta,
  ImportMeta,
  SourceMeta,
  ComponentMeta,
  CompoundComponentMeta,
  PackageDocMeta,
  GeneratorOutput,
} from "./schema";
import {
  SCHEMA_VERSION,
  validatePropMeta,
  validateComponentMeta,
  validateGeneratorOutput,
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

  it("PropMeta has deprecation and since fields", () => {
    expectTypeOf<PropMeta>().toHaveProperty("deprecationMessage");
    expectTypeOf<PropMeta>().toHaveProperty("since");
    expectTypeOf<PropMeta["deprecationMessage"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PropMeta["since"]>().toEqualTypeOf<string | undefined>();
  });

  it("ComponentMeta has import and source metadata", () => {
    expectTypeOf<ComponentMeta>().toHaveProperty("import");
    expectTypeOf<ComponentMeta>().toHaveProperty("source");
    expectTypeOf<ComponentMeta>().toHaveProperty("since");
  });

  it("ImportMeta has packagePath and namedExports", () => {
    expectTypeOf<ImportMeta>().toHaveProperty("packagePath");
    expectTypeOf<ImportMeta>().toHaveProperty("namedExports");
    expectTypeOf<ImportMeta["namedExports"]>().toExtend<readonly string[]>();
  });

  it("SourceMeta has filePath and propsInterface", () => {
    expectTypeOf<SourceMeta>().toHaveProperty("filePath");
    expectTypeOf<SourceMeta>().toHaveProperty("propsInterface");
  });

  it("GeneratorOutput has schemaVersion", () => {
    expectTypeOf<GeneratorOutput>().toHaveProperty("schemaVersion");
    expectTypeOf<GeneratorOutput["schemaVersion"]>().toEqualTypeOf<number>();
  });

  it("SCHEMA_VERSION is a number", () => {
    expect(typeof SCHEMA_VERSION).toBe("number");
    expect(SCHEMA_VERSION).toBe(1);
  });

  it("metadata is fully readonly (immutable contract)", () => {
    type WritableProps = { -readonly [K in keyof PropMeta]: PropMeta[K] };
    expectTypeOf<PropMeta>().not.toEqualTypeOf<WritableProps>();
  });
});

// ─── Validation ─────────────────────────────────────────────────────

describe("docs-generator: schema validation", () => {
  it("validatePropMeta accepts valid prop", () => {
    expect(
      validatePropMeta({
        name: "disabled",
        type: "boolean",
        required: false,
        defaultValue: undefined,
        description: "Whether disabled",
        deprecated: false,
        deprecationMessage: undefined,
        since: undefined,
      }),
    ).toBe(true);
  });

  it("validatePropMeta rejects invalid prop", () => {
    expect(validatePropMeta({})).toBe(false);
    expect(validatePropMeta(null)).toBe(false);
    expect(validatePropMeta("not an object")).toBe(false);
    expect(validatePropMeta({ name: 123 })).toBe(false);
  });

  it("validateComponentMeta accepts valid component", () => {
    expect(
      validateComponentMeta({
        name: "Button",
        packagePath: "@kairoui/core/components",
        propsInterface: "ButtonOwnProps",
        props: [],
        description: undefined,
        sourceFile: undefined,
        since: undefined,
        import: { packagePath: "@kairoui/core/components", namedExports: ["Button"] },
        source: { filePath: undefined, propsInterface: "ButtonOwnProps" },
      }),
    ).toBe(true);
  });

  it("validateComponentMeta rejects missing fields", () => {
    expect(validateComponentMeta({ name: "Button" })).toBe(false);
  });

  it("validateGeneratorOutput accepts valid output", () => {
    expect(
      validateGeneratorOutput({
        schemaVersion: 1,
        generatedAt: "2026-08-27T00:00:00.000Z",
        generatorVersion: "0.1.0",
        packages: [],
      }),
    ).toBe(true);
  });

  it("validateGeneratorOutput rejects invalid output", () => {
    expect(validateGeneratorOutput({})).toBe(false);
    expect(validateGeneratorOutput(null)).toBe(false);
  });

  it("round-trip serialization preserves structure", () => {
    const output: GeneratorOutput = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: "2026-08-27T00:00:00.000Z",
      generatorVersion: "0.1.0",
      packages: [
        {
          packageName: "@kairoui/core",
          entryPoint: "./components",
          components: [
            {
              name: "Button",
              packagePath: "@kairoui/core/components",
              propsInterface: "ButtonOwnProps",
              props: [
                {
                  name: "disabled",
                  type: "boolean",
                  required: false,
                  defaultValue: undefined,
                  description: "Disables the button",
                  deprecated: false,
                  deprecationMessage: undefined,
                  since: "0.1.0",
                },
              ],
              description: "A button component",
              sourceFile: "src/components/button/button.tsx",
              since: "0.1.0",
              import: { packagePath: "@kairoui/core/components", namedExports: ["Button"] },
              source: {
                filePath: "src/components/button/button.tsx",
                propsInterface: "ButtonOwnProps",
              },
            },
          ],
        },
      ],
    };
    const json = JSON.stringify(output);
    const parsed = JSON.parse(json) as GeneratorOutput;
    expect(validateGeneratorOutput(parsed)).toBe(true);
    expect(parsed.packages[0]?.components[0]?.props[0]?.name).toBe("disabled");
  });
});
