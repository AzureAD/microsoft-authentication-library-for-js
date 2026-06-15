module.exports = {
    displayName: "ExpressSample",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "node server.js",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    testTimeout: 120000, // tests involve CDN version switches + multiple sign-in flows
};
