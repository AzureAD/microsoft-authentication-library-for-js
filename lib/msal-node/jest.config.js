/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    verbose: true,
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js",
        "json",
        "jsx",
        "node"
    ],
    testMatch: [
        "<rootDir>/test/**/*.spec.ts"
    ],
    coverageReporters: [["lcov", {"projectRoot": "../../"}]]
};
