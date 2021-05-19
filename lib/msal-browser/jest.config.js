/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    preset: "ts-jest",
    globals: {
        crypto: require("./test/polyfills/msrcrypto.min")
    },
    testEnvironmentOptions: {
        url: "https://localhost:8081/index.html"
    }
};
