module.exports = {
    displayName: "Vanilla JS customizable e2e test",
    globals: {
        __PORT__: 30661,
        __STARTCMD__:
            "npm start -- --port 30661 --sample customizable-e2e-test",
    },
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
};
