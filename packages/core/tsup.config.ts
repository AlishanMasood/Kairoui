import { createConfig } from "../../tooling/tsup/config";

export default createConfig({
  entry: ["src/index.ts"],
  tsconfig: "tsconfig.build.json",
});
