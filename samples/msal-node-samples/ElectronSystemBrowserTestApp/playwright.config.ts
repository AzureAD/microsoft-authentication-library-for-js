import { PlaywrightTestConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
    testDir: "./tests",
    maxFailures: 2,
    use: {
        headless: false,
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    timeout: 30000,
    globalTimeout: 5400000,
};

export default config;