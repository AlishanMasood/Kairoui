/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * Generates the static CSS file for @kairoui/core.
 * Run after tsup build to produce dist/styles.css.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateStylesheet } from "../src/composition/generate-css";
import { generateLayerOrder } from "../src/composition/css-layers";
import { boxStyles } from "../src/primitives/box.styles";
import { textStyles } from "../src/primitives/text.styles";
import { buttonStyleContract } from "../src/proof/button.styles";

const contracts = [
  { contract: boxStyles },
  { contract: textStyles },
  { contract: buttonStyleContract },
];

const componentCss = generateStylesheet(contracts, { layer: "kui.components" });
const output = `${generateLayerOrder()}\n\n${componentCss}\n`;

const outPath = resolve(import.meta.dirname, "../dist/styles.css");
writeFileSync(outPath, output, "utf-8");

console.log(`Generated styles.css (${output.length} bytes)`);
