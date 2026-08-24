/*
 * Jest config for the opt-in Nested App Authentication *platform-broker* e2e
 * spec.
 *
 * Kept separate from `jest.config.cjs` (the CI-runnable web-flow bridge spec)
 * because the broker path:
 *   - drives branded Chrome via Playwright (loads the Microsoft SSO extension)
 *     instead of the shared jest-puppeteer preset,
 *   - starts the sample from `.env` (linked broker registrations) rather than
 *     `.env.e2e`, and
 *   - must NEVER run in CI. It only runs on a self-hosted, AAD-joined, WAM-
 *     enabled Windows agent, gated behind `NAA_BROKER_E2E=1` (see the spec's
 *     top-level guard) and invoked via `npm run test:e2e:broker`.
 */

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
