/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    testEnvironment: "jest-environment-jsdom-fifteen",
    globals: {
        crypto: require("crypto")
    },
    coverageReporters: [["lcov", {"projectRoot": "../../"}]]
};
