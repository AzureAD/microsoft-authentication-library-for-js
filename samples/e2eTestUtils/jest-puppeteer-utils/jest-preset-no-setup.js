module.exports = {
    testPathIgnorePatterns: ["/node_modules"],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    verbose: true,
    testMatch: ["**/test/**/**.spec.ts", "!**/test/**/*agc*.spec.ts"],
    testTimeout: 120000,
    testEnvironment: `${__dirname}/puppeteer_environment.js`
}