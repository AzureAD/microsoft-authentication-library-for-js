const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class PuppeteerEnvironment extends NodeEnvironment {
	constructor({ globalConfig, projectConfig }, context) {
		super({ globalConfig, projectConfig }, context);
	}

	async setup() {
		await super.setup();

		// connect to puppeteer
		this.global.__BROWSER__ = await puppeteer.launch({
			headless: true,
			ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"]
		});
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