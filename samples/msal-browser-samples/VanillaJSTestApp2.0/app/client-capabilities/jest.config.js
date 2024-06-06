module.exports = {
    displayName: "Vanilla JS client capabilities",
    globals: {
        __PORT__: 30660,
        __STARTCMD__: "npm start -- --port 30660 --sample client-capabilities",
    },
    testMatch: ["<rootDir>/test/**/*.spec.ts"],
    preset: "../../../../e2eTestUtils/jest-puppeteer-utils/jest-preset.js",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
};
