module.exports = {
    displayName: "Vanilla JS multiple resources",
    globals: {
        __PORT__: 30662,
        __STARTCMD__: "npm start -- --port 30662 --sample multipleResources",
    },
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
};
