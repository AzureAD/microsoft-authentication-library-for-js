const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const puppeteerTeardown = require("../../../e2eTestUtils/jest-puppeteer-utils/jestTeardown");
const { NESTED_APP_PORT } = require("../sampleConfig.cjs");

module.exports = async (jestOptions) => {
    await puppeteerTeardown(jestOptions);
    await serverUtils.killServer(NESTED_APP_PORT);
};
