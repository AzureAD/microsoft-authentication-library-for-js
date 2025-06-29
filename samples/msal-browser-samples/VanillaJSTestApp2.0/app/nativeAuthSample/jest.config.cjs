module.exports = {
    displayName: "Native Auth Sample App",
    globals: {
        __PORT__: 3000,
        __STARTCMD__: "npm start -- --port 3000 --sample nativeAuthSample",
    },
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
};
