/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");

module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    testEnvironmentOptions: {
        url: "https://localhost:8081/index.html"
    },
    collectCoverageFrom: ["src/**/*.ts"],
    coverageReporters: [["lcov", { "projectRoot": path.join(__dirname, "../../") }]],
    setupFilesAfterEnv: [path.join(__dirname, "setupCrypto.cjs")],
};
