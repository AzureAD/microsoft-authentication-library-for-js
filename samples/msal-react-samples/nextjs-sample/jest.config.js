module.exports = {
    displayName: "Next.js",
    globals: {
        __PORT__: 3200,
        __STARTCMD__: "env-cmd -f .env.e2e npm run start -- -p 3200"
    },
    preset: "../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js"
};
