module.exports = {
    displayName: "Vanilla JS customizable e2e local storage",
    globals: {
        __PORT__: 30663,
        __STARTCMD__: "npm start -- --port 30663 --sample customizable-e2e-local-storage",
    },
    testMatch: [
        "<rootDir>/test/**/*.spec.ts",
    ],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
};
