import { PlaywrightTestConfig, devices } from "@playwright/test";
import { RETRY_TIMES } from '../../e2eTestUtils/TestUtils';

const config: PlaywrightTestConfig = {
    testDir: "./tests",
    maxFailures: 2,
    retries: RETRY_TIMES,
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