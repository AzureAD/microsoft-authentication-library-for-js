module.exports = {
    displayName: "angular-standalone-sample",
    globals: {
        __PORT__: 4217,
        // TODO: Remove --prebundle=false after Angular/Vite fixes the Windows access violation (0xC0000005).
        __STARTCMD__: "npm start -- --port 4217 --prebundle=false",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
