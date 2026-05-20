import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["lib/index.ts"],
  format: "esm",
  platform: "node",
  dts: { build: true },
  sourcemap: true,
  target: "node20",
});
