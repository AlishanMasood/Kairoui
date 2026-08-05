import { createConfig } from "../../tooling/tsup/config";

export default createConfig({
  entry: ["src/index.ts", "src/composition.ts"],
  tsconfig: "tsconfig.build.json",
});
