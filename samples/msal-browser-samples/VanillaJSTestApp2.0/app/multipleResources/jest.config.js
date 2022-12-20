module.exports = {
    displayName: "Vanilla JS multiple resources",
    globals: {
        __PORT__: 30665,
        __STARTCMD__: "npm start -- --port 30665 --sample multipleResources",
    },
    testMatch: [
        "<rootDir>/test/**/*.spec.ts",
    ],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
};
