const serverUtils = require("./serverUtils");

module.exports = async (jestOptions) => {
    await serverUtils.killServers(jestOptions);
}