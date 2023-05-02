/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverageFrom: ["src/**/*.ts"],
    coverageReporters: [["lcov", { "projectRoot": "../../" }]],
    moduleNameMapper: {
        '^@azure/msal-common$': '<rootDir>/../../lib/msal-common/src'
    }
};
