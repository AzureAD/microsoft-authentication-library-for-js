module.exports = {
    displayName: "Untrusted top frame sample",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "env-cmd -f .env npm run start:https",
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
};
