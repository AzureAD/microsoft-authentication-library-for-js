/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const jestConfig = require("../../shared-configs/jest-config/jest.config.cjs");

module.exports = jestConfig;

//module.exports = {
//    preset: "ts-jest",
//    testEnvironment: "jsdom",
//    collectCoverageFrom: ["src/**/*.ts"],
//    coverageReporters: [["lcov", { "projectRoot": "../../" }]],
//    globals: {
//        crypto: require("crypto")
//    },
//};

