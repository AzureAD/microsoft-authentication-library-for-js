/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    verbose: true,
    moduleFileExtensions: ["ts", "tsx", "js", "json", "jsx", "node"],
    reporters: ["default", "jest-junit"],
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
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
        "^(\\.\\.?\\/.+)\\.js$": "$1",
    },
    coverageReporters: [["lcov", { projectRoot: "../../" }]],
    testEnvironment: "node",
};
