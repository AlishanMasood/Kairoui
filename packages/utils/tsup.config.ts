import { createConfig } from "../../tooling/tsup/config";

export default createConfig({
  entry: ["src/index.ts", "src/dom.ts", "src/events.ts", "src/date.ts"],
  tsconfig: "tsconfig.build.json",
});
