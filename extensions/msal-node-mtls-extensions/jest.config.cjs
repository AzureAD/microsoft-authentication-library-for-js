/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const jestConfig = require("../../shared-configs/jest-config/jest.config.cjs");

module.exports = {
    ...jestConfig,
    reporters: ["default"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                diagnostics: {
                    ignoreCodes: [1343],
                },
                astTransformers: {
                    before: [
                        {
                            path: "ts-jest-mock-import-meta",
                            options: {
                                metaObjectReplacement: {
                                    url: "http://localhost:3000",
                                },
                            },
                        },
                    ],
                },
            },
        ],
    },
    moduleNameMapper: {
        // Map ./package.json lookups in NativeHelper.ts (src/internal/) to lib/package.json
        // so getAddonPath() can resolve the package root correctly during tests.
        "^\\./package\\.json$": "<rootDir>/lib/package.json",
        // Redirect the C++ native addon to a JS mock so tests don't require a built .node file.
        ".*msal_mtls_win\\.node$": "<rootDir>/test/__mocks__/native-addon.js",
    },
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    testEnvironment: "node",
};
