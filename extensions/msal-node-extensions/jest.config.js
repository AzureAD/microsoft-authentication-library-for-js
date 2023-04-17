/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    coverageReporters: [["lcov", { "projectRoot": "../../" }]]
};
