module.exports = {
    testPathIgnorePatterns: ["/node_modules"],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    verbose: true,
    testMatch: ["**/test/**/**.spec.ts", "!**/test/**/*agc*.spec.ts"],
    testEnvironment: `${__dirname}/puppeteer_environment.js`
}