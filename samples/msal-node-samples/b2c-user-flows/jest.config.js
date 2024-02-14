/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    displayName: "B2C User Flows",
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset-no-setup.js",
    reporters: [
        [
            "jest-junit",
            {
                suiteName: "B2C User Flows E2E Tests",
                outputDirectory: ".",
                outputName: "junit.xml",
            },
        ],
    ],
};
