module.exports = {
    root: true,
    env: { node: true, es2022: true },
    parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    extends: ["eslint:recommended"],
    rules: { "no-empty": ["error", { allowEmptyCatch: true }] },
    overrides: [
        {
            files: ["src/**/*.ts"],
            parser: "@typescript-eslint/parser",
            plugins: ["@typescript-eslint"],
            extends: ["plugin:@typescript-eslint/recommended"],
            rules: {
                "no-undef": "off",
                "@typescript-eslint/no-empty-function": "off",
                "@typescript-eslint/no-unused-vars": [
                    "error",
                    { args: "none" },
                ],
            },
        },
    ],
};
