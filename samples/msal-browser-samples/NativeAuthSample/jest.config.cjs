module.exports = {
    displayName: "Native Auth Sample App E2E tests",
    globals: {
        __PORT__: 30670,
        __STARTCMD__: "npm start -- --port 30670",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
};
