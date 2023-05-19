import { defineConfig, devices } from "@playwright/test";

/**
 * For more information about Playwright configuration options, visit:
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: "./test",
    timeout: 30 * 1000,
    expect: {
        timeout: 5000,
    },
    use: {
        actionTimeout: 0,
        trace: "on-first-retry",
        headless: false,
        launchOptions: {
            slowMo: 50,
        },
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },

        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },

        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
    ],

    webServer: {
        command: "npm run start",
        port: 30662,
    },
});