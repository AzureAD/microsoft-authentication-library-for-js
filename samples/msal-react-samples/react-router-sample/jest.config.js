module.exports = {
    displayName: "React Router",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "env-cmd -f .env.e2e npm start",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
};
