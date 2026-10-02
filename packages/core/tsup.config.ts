import { createConfig } from "../../tooling/tsup/config";

export default createConfig({
  entry: [
    "src/index.ts",
    "src/composition.ts",
    "src/primitives/index.ts",
    "src/components/index.ts",
    "src/components/data-table/data-grid.ts",
    "src/components/overlay/command.ts",
  ],
  tsconfig: "tsconfig.build.json",
});
