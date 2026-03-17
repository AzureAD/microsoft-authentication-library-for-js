import { PlaywrightTestConfig, devices } from "@playwright/test";
import { RETRY_TIMES } from "e2e-test-utils";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
    testDir: "./test",
    maxFailures: 2,
    /* Run tests in files in parallel */
    //fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    //forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: RETRY_TIMES,
    /* Opt out of parallel tests on CI. */
    //workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('')`. */
        baseURL: "https://localhost:30662",

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
        headless: true,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },

        // {
        //     name: "firefox",
        //     use: { ...devices["Desktop Firefox"] },
        // },

        // {
        //     name: "webkit",
        //     use: { ...devices["Desktop Safari"] },
        // },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ],

    timeout: 20000,
    globalTimeout: 80000,

    /* Run your local dev servers before starting the tests */
    webServer: [
        {
            command: "npm run start:https",
            url: "https://localhost:30662",
            reuseExistingServer: !process.env.CI,
            ignoreHTTPSErrors: true,
        },
        {
            command: "npm run start:server:https",
            url: "https://localhost:30663",
            reuseExistingServer: !process.env.CI,
            ignoreHTTPSErrors: true,
        },
    ],
};

export default config;
