const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

// Polyfill globalThis.crypto for Node.js < 19.
// @azure/keyvault-secrets 4.9+ depends on @typespec/ts-http-runtime which calls
// crypto.randomUUID() as a Web Crypto global, unavailable before Node.js 19.
if (typeof globalThis.crypto === 'undefined') {
    const { webcrypto } = require('crypto');
    globalThis.crypto = webcrypto;
}

class PuppeteerEnvironment extends NodeEnvironment {
	constructor({ globalConfig, projectConfig }, context) {
		super({ globalConfig, projectConfig }, context);
	}

	async setup() {
		await super.setup();

		// connect to puppeteer
		this.global.__BROWSER__ = await puppeteer.launch({
			headless: true,
			timeout: 60000
		});
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