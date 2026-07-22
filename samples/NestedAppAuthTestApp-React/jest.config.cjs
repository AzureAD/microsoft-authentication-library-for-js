module.exports = {
    displayName: "NAA platform-broker test app",
    testTimeout: 120000,
    globals: {
        __PORT__: 30668,
        __STARTCMD__: "env-cmd -f .env.e2e npm run start:all",
    },
    preset: "../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
};
