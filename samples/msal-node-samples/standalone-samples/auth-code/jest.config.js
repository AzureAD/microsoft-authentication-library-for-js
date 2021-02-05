/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    displayName: "Authorization Code AAD",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "npm start -- -p 3000"
    },
    preset: "../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};