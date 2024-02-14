/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    displayName: "Device Code",
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset-no-setup.js",
    reporters: [
        "jest-junit", {
            "suiteName": "Device Code E2E Tests",
            "outputDirectory": ".",
            "outputName": "junit.xml"
        }
    ]
};