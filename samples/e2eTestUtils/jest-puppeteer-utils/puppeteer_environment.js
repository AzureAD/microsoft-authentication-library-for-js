const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class PuppeteerEnvironment extends NodeEnvironment {
	constructor({ globalConfig, projectConfig }, context) {
		super({ globalConfig, projectConfig }, context);
	}

	async setup() {
		process.stdout.write("SETUP STARGING");
		await super.setup();

		// connect to puppeteer
		this.global.__BROWSER__ = await puppeteer.launch({
			headless: true,
			ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"]
		});

		process.stdout.write(JSON.parse(this.global.__BROWSER__) + "SETUP FINISHED");
	}

	async teardown() {
		process.stdout.write("TEARDOWN STARGING");
		await super.teardown();
		process.stdout.write(JSON.parse(this.global.__BROWSER__) + "TEARDOWN FINISHED");
		this.global.__BROWSER__.close();
	}

	runScript(script) {
		return super.runScript(script);
	}
}

module.exports = PuppeteerEnvironment;