module.exports = {
    displayName: "angular13-rxjs6-sample-app",
    globals: {
        __PORT__: 4209,
        __STARTCMD__: "npm start -- --port 4209 --configuration=e2e",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
