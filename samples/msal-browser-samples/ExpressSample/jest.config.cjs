module.exports = {
    displayName: "ExpressSample",
    rootDir: __dirname,
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "npm run start:e2e",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    maxWorkers: 1, // Tests share one sample server whose MSAL version can be switched at runtime.
    testTimeout: 120000, // tests involve CDN version switches + multiple sign-in flows
};
