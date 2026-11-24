module.exports = {
    displayName: "Nested Auth App Sample",
    testTimeout: 120000,
    moduleNameMapper: {
        "^puppeteer$": require.resolve(
            "../../e2eTestUtils/jest-puppeteer-utils/puppeteer.cjs"
        ),
    },
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
    testMatch: ["**/test/**/*.spec.ts"],
    testPathIgnorePatterns: ["/node_modules"],
    testEnvironment: "node",
    verbose: true,
    globalSetup: "<rootDir>/test/jestSetup.cjs",
    globalTeardown: "<rootDir>/test/jestTeardown.cjs",
};
