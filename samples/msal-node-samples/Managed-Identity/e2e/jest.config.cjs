/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    displayName: "Managed Identity E2E",
    preset: "ts-jest",
    testEnvironment: "node",
    verbose: true,
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    testTimeout: 60000,
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "test-results",
                outputName: "junit-mi-e2e.xml",
            },
        ],
    ],
};
