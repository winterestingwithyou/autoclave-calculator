import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";

export default [
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Prettier integration - show formatting issues as warnings
      "prettier/prettier": "warn",
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**"],
  },
];
