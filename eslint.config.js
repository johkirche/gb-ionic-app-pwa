import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  eslintConfigPrettier,
  {
    files: ["**/*.vue", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        node: true,
        es2020: true,
      },
    },
    rules: {
      "no-console": import.meta.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": import.meta.env.NODE_ENV === "production" ? "warn" : "off",
      "vue/no-deprecated-slot-attribute": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
