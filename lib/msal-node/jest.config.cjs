/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    verbose: true,
    moduleFileExtensions: ["ts", "tsx", "js", "json", "jsx", "node"],
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
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
