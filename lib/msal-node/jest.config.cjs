/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    verbose: true,
    moduleFileExtensions: ["ts", "tsx", "js", "json", "jsx", "node"],
    reporters: ["default", "jest-junit"],
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    transform: {"^.+\\.(ts|tsx|js)$": ["ts-jest", { useESM: true }]},
    /**
     * uuid v12+ ships as ESM-only with no CommonJS build. Jest runs in CJS mode by default,
     * so without this exception tests will fail with "SyntaxError: Cannot use import statement in a module".
     * https://github.com/uuidjs/uuid/blob/main/CHANGELOG.md#-breaking-changes-2
     * note: Jest's ESM support is experimental; consider migrating to Vitest which is ESM-native.
     */
    transformIgnorePatterns: ["/node_modules/(?!uuid)"],
    /**
     * "Not a ts-jest issue" but a jest one. Consider vitest?
     *  this morphs "./some/relative/path.js" to "./some/relative/path"
     *  https://github.com/kulshekhar/ts-jest/issues/1057
     */
    moduleNameMapper: {
        "^(\\.\\.?\\/.+)\\.js$": "$1",
    },
    coverageReporters: [["lcov", { projectRoot: "../../" }]],
};
