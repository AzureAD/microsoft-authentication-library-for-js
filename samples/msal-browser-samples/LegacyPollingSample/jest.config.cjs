module.exports = {
    displayName: "Legacy polling sample",
    globals: {
        __PORT__: 30664,
        __STARTCMD__: "env-cmd -f .env.e2e npm run start",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
};
