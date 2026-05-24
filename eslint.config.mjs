// ESLint flat config.

import js from "@eslint/js";
import importPlugin from "eslint-plugin-import-x";
import foundryGlobals from "./eslint.foundry-globals.mjs";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "tasks/", "REFERENCE/", "commitlint.config.js", "lint-staged.config.js", ".releaserc.js"],
  },

  {
    files: ["module/**/*.js", "utils/**/*.{js,mjs}"],
    ...js.configs.recommended,
  },

  {
    files: ["module/**/*.js", "utils/**/*.{js,mjs}"],
    ...importPlugin.flatConfigs.errors,
  },
  {
    files: ["module/**/*.js", "utils/**/*.{js,mjs}"],
    ...importPlugin.flatConfigs.warnings,
  },

  {
    files: ["module/**/*.js", "utils/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jquery,
        ...foundryGlobals,
        PIXI: "readonly",
        PoolTerm: "readonly",
        Sequencer: "readonly",
        Sequence: "readonly",
        dragRuler: "readonly",
        AutoAnimations: "readonly",
        fromUuidSync: "readonly",
      },
    },
    rules: {
      "prefer-const": "error",
      "no-return-await": "error",
    },
  },
];
