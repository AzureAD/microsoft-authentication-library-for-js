const puppeteer = require("puppeteer");
const NodeEnvironment = require("jest-environment-node").TestEnvironment;

class PuppeteerEnvironment extends NodeEnvironment {
    constructor({ globalConfig, projectConfig }, context) {
        super({ globalConfig, projectConfig }, context);
    }

    async setup() {
        await super.setup();

        const launchOptions = {
            headless: process.env.HEADLESS !== "false",
            timeout: 60000,
        };

        // Platform-broker (JS-WAM) flows require the Microsoft Single Sign-on
        // browser extension. That extension can only be supplied by a real,
        // managed Chrome profile, so when CHROME_USER_DATA_DIR is provided we
        // launch that installed profile instead of the bundled Chromium. This
        // is opt-in: without these env vars the default bundled browser is used.
        if (process.env.CHROME_USER_DATA_DIR) {
            launchOptions.userDataDir = process.env.CHROME_USER_DATA_DIR;
            // Chrome only loads extensions in headful mode.
            launchOptions.headless = false;
            if (process.env.CHROME_PROFILE_DIRECTORY) {
                launchOptions.args = [
                    ...(launchOptions.args || []),
                    `--profile-directory=${process.env.CHROME_PROFILE_DIRECTORY}`,
                ];
            }
        }

        if (process.env.CHROME_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
        } else if (process.env.CHROME_CHANNEL) {
            launchOptions.channel = process.env.CHROME_CHANNEL;
        }

        // connect to puppeteer
        this.global.__BROWSER__ = await puppeteer.launch(launchOptions);
    }

    async teardown() {
        await super.teardown();
        await this.global.__BROWSER__?.close();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = PuppeteerEnvironment;
