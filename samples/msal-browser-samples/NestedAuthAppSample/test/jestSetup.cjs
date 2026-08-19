const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const puppeteerSetup = require("../../../e2eTestUtils/jest-puppeteer-utils/jestSetup");
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs");

module.exports = async (jestOptions) => {
    await serverUtils.killServer(HOST_APP_PORT);
    await serverUtils.killServer(NESTED_APP_PORT);
    await puppeteerSetup(jestOptions);
};
