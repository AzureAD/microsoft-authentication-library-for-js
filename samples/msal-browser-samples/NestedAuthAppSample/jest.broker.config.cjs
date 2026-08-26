// Opt-in jest config for the platform-broker NAA e2e spec. Runs only via
// `npm run test:e2e:broker` (never in CI). See test/broker/brokerHarness.ts.

module.exports = {
    displayName: "NAA Sample (platform broker)",
    testTimeout: 300000,
    testEnvironment: "node",
    testMatch: ["<rootDir>/test/broker/**/*.spec.ts"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            { tsconfig: "<rootDir>/tsconfig.json" },
        ],
    },
    globalSetup: "<rootDir>/test/broker/jestGlobalSetup.cjs",
    globalTeardown: "<rootDir>/test/broker/jestGlobalTeardown.cjs",
};
