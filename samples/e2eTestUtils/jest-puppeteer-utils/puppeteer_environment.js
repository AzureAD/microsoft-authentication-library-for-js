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
