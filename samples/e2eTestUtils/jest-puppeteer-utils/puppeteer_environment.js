const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node');

class PuppeteerEnvironment extends NodeEnvironment {
    constructor(config) {
        super(config);
    }

	async setup() {
		await super.setup();

		// connect to puppeteer
		this.global.__BROWSER__ = await puppeteer.launch();
	}

	async teardown() {
		await super.teardown();
		this.global.__BROWSER__.close();
	}

	runScript(script) {
		return super.runScript(script);
	}
}

module.exports = PuppeteerEnvironment;