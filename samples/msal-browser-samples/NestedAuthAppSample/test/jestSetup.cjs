const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const puppeteerSetup = require("../../../e2eTestUtils/jest-puppeteer-utils/jestSetup");

module.exports = async (jestOptions) => {
    await serverUtils.killServer(30668);
    await serverUtils.killServer(30667);
    await puppeteerSetup(jestOptions);
};
