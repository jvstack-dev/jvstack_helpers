// @ts-check

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  globalIgnores(["dist", "node_modules", ".turbo"]),
  eslintPluginPrettierRecommended,
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: { projectService: true },
    },
  },
  {
    rules: {
      "prettier/prettier": ["error", { singleQuote: false, semi: true, printWidth: 120 }],
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
    },
  },
]);
