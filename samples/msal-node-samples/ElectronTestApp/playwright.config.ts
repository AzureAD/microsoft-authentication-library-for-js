import { PlaywrightTestConfig } from "@playwright/test";
import * as path from "path";

const config: PlaywrightTestConfig = {
    testDir: path.join(__dirname, "/test"),
    retries: 1,
    use: {
        trace: "on-first-retry",
    },
    timeout: 30000,
    globalTimeout: 5400000,
    workers: process.env.CI ? 1 : undefined,
};

export default config;
