/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const jestConfig = require("../../shared-configs/jest-config/jest.config.cjs");

module.exports = {
    ...jestConfig,
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                // The configuration below is for mocking import.meta.url in DPAPI as jest only has experimental support for ESM
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
    testEnvironment: "node",
};
