module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        sourceType: "module",
        ecmaFeatures: {
            modules: true
        }
    },
    env: {
        browser: true,
        mocha: true
    },
    extends: [
        "./rules/base.js",
        "./rules/tslint.js"
    ]
};
