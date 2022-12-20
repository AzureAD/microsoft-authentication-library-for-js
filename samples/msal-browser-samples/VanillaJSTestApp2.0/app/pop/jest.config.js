module.exports = {
    displayName: "Vanilla JS pop",
    globals: {
        __PORT__: 30667,
        __STARTCMD__: "npm start -- --port 30667 --sample pop",
    },
    testMatch: [
        "<rootDir>/test/**/*.spec.ts",
    ],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
};
