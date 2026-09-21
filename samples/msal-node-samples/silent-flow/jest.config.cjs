/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    displayName: "Silent Flow",
    globalSetup:
        "<rootDir>/../../../.pipelines/scripts/install-local-msal-node-package.cjs",
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset-no-setup.js",
    testMatch: ["**/test/**/**.spec.ts"],
};
