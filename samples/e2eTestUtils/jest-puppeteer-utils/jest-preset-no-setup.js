module.exports = {
    testPathIgnorePatterns: ["/node_modules"],
    moduleNameMapper: {
        "^puppeteer$": `${__dirname}/puppeteer.cjs`,
    },
    transform: {
        "^.+\\.ts?$": ["ts-jest", { compiler: require.resolve("typescript") }],
    },
    verbose: true,
    testMatch: ["**/test/**/**.spec.ts", "!**/test/**/*agc*.spec.ts"],
    testTimeout: 120000,
    testEnvironment: `${__dirname}/puppeteer_environment.js`,
};
