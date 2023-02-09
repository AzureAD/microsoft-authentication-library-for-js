module.exports = {
    displayName: "TypeScript",
    globals: {
        __PORT__: 3002,
        __STARTCMD__: "env-cmd -f .env.e2e npm start"
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
