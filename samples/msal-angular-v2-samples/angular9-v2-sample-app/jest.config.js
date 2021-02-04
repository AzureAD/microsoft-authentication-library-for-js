module.exports = {
    displayName: "angular9-v2-sample-app",
    globals: {
        __PORT__: 4200,
        __STARTCMD__: "npm start -- --port 4200",
        __TIMEOUT__: 45000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
