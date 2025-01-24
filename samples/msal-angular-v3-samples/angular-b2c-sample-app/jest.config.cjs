module.exports = {
    displayName: "angular-b2c-sample-app",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "npm start -- --port 3000 --configuration=e2e",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
