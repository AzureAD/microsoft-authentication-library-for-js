module.exports = {
    displayName: "ExpressSample",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "npx --no-install env-cmd -f .env.e2e npm start",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    maxWorkers: 1, // Tests share one sample server whose MSAL version can be switched at runtime.
    testTimeout: 120000, // tests involve CDN version switches + multiple sign-in flows
};
