const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const puppeteerTeardown = require("../../../e2eTestUtils/jest-puppeteer-utils/jestTeardown");

module.exports = async (jestOptions) => {
    await puppeteerTeardown(jestOptions);
    await serverUtils.killServer(30667);
};
