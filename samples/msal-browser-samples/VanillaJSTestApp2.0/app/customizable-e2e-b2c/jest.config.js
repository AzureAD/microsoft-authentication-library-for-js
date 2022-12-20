module.exports = {
    displayName: "Vanilla JS customizable e2e b2c",
    globals: {
        __PORT__: 30662,
        __STARTCMD__: "npm start -- --port 30662 --sample customizable-e2e-b2c",
    },
    testMatch: [
        "<rootDir>/test/**/*.spec.ts",
    ],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
};
