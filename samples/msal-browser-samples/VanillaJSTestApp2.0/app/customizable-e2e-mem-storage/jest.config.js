module.exports = {
    displayName: "Vanilla JS customizable e2e memory storage",
    globals: {
        __PORT__: 30664,
        __STARTCMD__: "npm start -- --port 30664 --sample customizable-e2e-mem-storage",
    },
    testMatch: [
        "<rootDir>/test/**/*.spec.ts",
    ],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
};
