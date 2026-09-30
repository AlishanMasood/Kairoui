import { createConfig } from "../../tooling/tsup/config";

export default createConfig({
  entry: ["src/index.ts", "src/styles.css"],
  tsconfig: "tsconfig.build.json",
});
