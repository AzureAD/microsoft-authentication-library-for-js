module.exports = {
    testPathIgnorePatterns: ["/node_modules"],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    verbose: true,
    testMatch: ["**/test/**/**.spec.ts", "!**/test/**/*agc*.spec.ts"],
    testTimeout: 60000,
    slowTestThreshold: 30,
    bail: 1,
    globalSetup: `${__dirname}/jestSetup.js`,
    globalTeardown: `${__dirname}/jestTeardown.js`,
    testEnvironment: `${__dirname}/puppeteer_environment.js`
}