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
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    testEnvironment: "node",
};
