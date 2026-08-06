const { HOST_APP_PORT } = require("./sampleConfig.cjs");

module.exports = {
    displayName: "Nested Auth App Sample",
    testTimeout: 120000,
    globals: {
        __PORT__: HOST_APP_PORT,
        __STARTCMD__: "env-cmd -f .env.e2e npm run start:https",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    globalSetup: "<rootDir>/test/jestSetup.cjs",
    globalTeardown: "<rootDir>/test/jestTeardown.cjs",
};
