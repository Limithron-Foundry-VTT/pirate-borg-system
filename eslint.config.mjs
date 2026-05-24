// ESLint flat config.

import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import i18nJsonPlugin from "eslint-plugin-i18n-json";
import foundryGlobals from "@typhonjs-fvtt/eslint-config-foundry.js/0.8.0.js";
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
        ...foundryGlobals.globals,
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

  {
    files: ["lang/*.json"],
    plugins: {
      "i18n-json": i18nJsonPlugin,
    },
    processor: i18nJsonPlugin.processors[".json"],
    rules: {
      "i18n-json/valid-message-syntax": [2, { syntax: "icu" }],
      "i18n-json/valid-json": 2,
      "i18n-json/sorted-keys": [2, { order: "asc", indentSpaces: 2 }],
      "i18n-json/identical-keys": 0,
    },
  },
];
