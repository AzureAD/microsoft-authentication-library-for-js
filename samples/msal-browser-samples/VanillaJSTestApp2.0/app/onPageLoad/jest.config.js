module.exports = {
    displayName: "Vanilla JS onPageLoad",
    globals: {
        __PORT__: 30666,
        __STARTCMD__: "npm start -- --port 30666 --sample onPageLoad",
    },
    testMatch: [
        "<rootDir>/test/**/*.spec.ts",
    ],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
};
