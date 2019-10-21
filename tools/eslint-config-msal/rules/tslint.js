module.exports = {
    plugins: [ "@typescript-eslint/eslint-plugin", "@typescript-eslint/eslint-plugin-tslint" ],
    extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    rules: {
        "@typescript-eslint/array-type": 0,
        "@typescript-eslint/ban-ts-ignore": 1,
        "@typescript-eslint/ban-types": 0,
        "@typescript-eslint/camelcase": 0,
        "@typescript-eslint/explicit-member-accessibility": 0,
        "@typescript-eslint/indent": [2, 4, { "SwitchCase": 1 }],
        "@typescript-eslint/interface-name-prefix": 0,
        "@typescript-eslint/member-delimiter-style": 0,
        "@typescript-eslint/no-angle-bracket-type-assertion": 0,
        "@typescript-eslint/no-empty-function": 1,
        "@typescript-eslint/no-inferrable-types": 0,
        "@typescript-eslint/no-object-literal-type-assertion": 0,
        "@typescript-eslint/prefer-interface": 0,
        "@typescript-eslint/semi": 2,
        "@typescript-eslint/type-annotation-spacing": 0,
    }
};
