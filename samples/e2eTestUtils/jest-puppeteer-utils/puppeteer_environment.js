const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class PuppeteerEnvironment extends NodeEnvironment {
	constructor({ globalConfig, projectConfig }, context) {
		super({ globalConfig, projectConfig }, context);
	}

	async setup() {
		process.stdout.write("SETUP STARTING");
		await super.setup();

		const puppeteerConfig = {
			headless: "new",
			ignoreDefaultArgs: (process.env.CI) ? [] : ["--no-sandbox", "–disable-setuid-sandbox"],
		};

		// connect to puppeteer
		this.global.__BROWSER__ = await puppeteer.launch(puppeteerConfig);

		process.stdout.write(JSON.parse(this.global.__BROWSER__) + "SETUP FINISHED");
	}

	async teardown() {
		process.stdout.write("TEARDOWN STARTING");
		await super.teardown();
		if(this.global.__BROWSER__) {
		process.stdout.write(JSON.parse(this.global.__BROWSER__) + "TEARDOWN FINISHED");
			this.global.__BROWSER__.close();
		}
	}

	runScript(script) {
		return super.runScript(script);
	}
}

module.exports = PuppeteerEnvironment;