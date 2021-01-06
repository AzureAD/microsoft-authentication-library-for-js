const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

module.exports = () => {
    serverUtils.killServer(__dirname);
}