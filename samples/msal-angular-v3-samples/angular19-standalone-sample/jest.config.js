module.exports = {
    displayName: "angular19-standalone-sample",
    globals: {
        __PORT__: 4219,
        __STARTCMD__: "npm start -- --port 4219",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
