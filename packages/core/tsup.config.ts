import { createConfig } from "../../tooling/tsup/config";

export default createConfig({
  entry: ["src/index.ts"],
  // Core will need CSS support once components exist:
  // esbuildOptions(options) { options.loader = { ...options.loader, '.css': 'css' }; }
});
