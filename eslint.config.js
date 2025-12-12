import js from "@eslint/js";
import globals from "globals";
import { fixupPluginRules } from "@eslint/compat";
import importPlugin from "eslint-plugin-import";
import i18nJsonPlugin from "eslint-plugin-i18n-json";

// Import Foundry VTT globals from the config package
import foundryConfig from "@typhonjs-fvtt/eslint-config-foundry.js";

// Create the fixed-up i18n-json plugin
const i18nJson = fixupPluginRules(i18nJsonPlugin);

export default [
  // Ignore patterns
  {
    ignores: ["node_modules/**", "packs/**", "css/**"],
  },
  // Base recommended config
  js.configs.recommended,
  // JavaScript files configuration
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jquery,
        // Foundry VTT globals
        ...foundryConfig.globals,
        // Additional Foundry VTT globals not in the config package
        fromUuidSync: "readonly",
        // Custom globals for this project
        PIXI: "readonly",
        PoolTerm: "readonly",
        Sequencer: "readonly",
        Sequence: "readonly",
        dragRuler: "readonly",
        AutoAnimations: "readonly",
      },
    },
    plugins: {
      import: fixupPluginRules(importPlugin),
    },
    rules: {
      "prefer-const": "error",
      "no-return-await": "error",
      ...importPlugin.configs.recommended.rules,
    },
  },
  // JSON files configuration for i18n-json plugin
  {
    files: ["lang/*.json"],
    plugins: {
      "i18n-json": i18nJson,
    },
    processor: i18nJson.processors[".json"],
    rules: {
      "i18n-json/valid-message-syntax": [
        "error",
        {
          syntax: "icu",
        },
      ],
      "i18n-json/valid-json": "error",
      "i18n-json/sorted-keys": [
        "error",
        {
          order: "asc",
          indentSpaces: 2,
        },
      ],
      "i18n-json/identical-keys": "off",
    },
  },
];
