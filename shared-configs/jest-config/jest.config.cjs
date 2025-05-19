/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");

module.exports = {
    preset: "ts-jest",
    resolver: "ts-jest-resolver",
    testEnvironment: "jsdom",
    testEnvironmentOptions: {
        url: "https://localhost:8081/index.html"
    },
    collectCoverageFrom: ["src/**/*.ts"],
    collectCoverage: true,
    coverageReporters: [["lcov", { "projectRoot": path.join(__dirname, "../../") }], "json", "html"],
    setupFilesAfterEnv: [path.join(__dirname, "setupGlobals.cjs")],
};
