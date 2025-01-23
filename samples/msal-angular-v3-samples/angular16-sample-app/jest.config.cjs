module.exports = {
    displayName: "angular16-sample-app",
    globals: {
        __PORT__: 4216,
        __STARTCMD__: "npm start -- --port 4216",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
