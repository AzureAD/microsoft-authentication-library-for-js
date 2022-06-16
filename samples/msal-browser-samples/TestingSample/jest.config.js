module.exports = {
  preset: "jest-puppeteer",
  globals: {
    URL: "http://localhost:30662"
  },
  testMatch: [
    "**.spec.ts"
  ],
  testPathIgnorePatterns: ["/node_modules"],
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  verbose: true
};