module.exports = {
    displayName: "angular-b2c-sample",
    globals: {
        __PORT__: 4215,
        // TODO: Remove --prebundle=false after Angular/Vite fixes the Windows access violation (0xC0000005).
        __STARTCMD__: "npm start -- --port 4215 --configuration=e2e --prebundle=false",
        __TIMEOUT__: 90000
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
