module.exports = {
    testPathIgnorePatterns: ["/node_modules"],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    verbose: true,
    testMatch: ["**/test/**.spec.ts"],
    globalSetup: "./test/jestSetup.js",
    globalTeardown: "./test/jestTeardown.js"
}