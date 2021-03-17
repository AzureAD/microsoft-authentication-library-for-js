module.exports = {
    displayName: "angular11-sample-app",
    globals: {
        __PORT__: 4207,
        __STARTCMD__: "npm start -- --port 4207",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
