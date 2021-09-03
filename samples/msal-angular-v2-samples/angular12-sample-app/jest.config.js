module.exports = {
    displayName: "angular12-sample-app",
    globals: {
        __PORT__: 4208,
        __STARTCMD__: "npm start -- --port 4208",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
