module.exports = {
    displayName: "Popup origin check sample",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "env-cmd -f .env npm start",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
};
