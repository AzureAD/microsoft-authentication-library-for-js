import baseConfig from "office-addin-lint/config/eslint.config.mjs";

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        console: "readonly",
        fetch: "readonly",
      },
    },
  },
];