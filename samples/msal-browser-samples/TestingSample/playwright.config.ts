import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./test",
    timeout: 30 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
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