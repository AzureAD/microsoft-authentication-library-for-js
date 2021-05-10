module.exports = {
    displayName: "Gatsby",
    globals: {
        __PORT__: 3001,
        __STARTCMD__: "npm run serve -- -p 3001"
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};