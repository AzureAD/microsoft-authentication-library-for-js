module.exports = {
    displayName: "angular10-sample-app",
    globals: {
        __PORT__: 4201,
        __STARTCMD__: "npm start -- --port 4201",
        __TIMEOUT__: 45000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
