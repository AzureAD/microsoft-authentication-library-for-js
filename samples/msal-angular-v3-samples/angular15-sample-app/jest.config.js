module.exports = {
    displayName: "angular15-sample-app",
    globals: {
        __PORT__: 4215,
        __STARTCMD__: "npm start -- --port 4215",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
