const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs");

const SERVER_READY_TIMEOUT_MS = 120000;

module.exports = async () => {
    await serverUtils.killServer(HOST_APP_PORT);
    await serverUtils.killServer(NESTED_APP_PORT);

    serverUtils.startServer("npm run start:e2e", __dirname + "/..");

    const [hostUp, nestedUp] = await Promise.all([
        serverUtils.isServerUp(HOST_APP_PORT, SERVER_READY_TIMEOUT_MS),
        serverUtils.isServerUp(NESTED_APP_PORT, SERVER_READY_TIMEOUT_MS),
    ]);
    if (!hostUp || !nestedUp) {
        await serverUtils.killServer(HOST_APP_PORT);
        await serverUtils.killServer(NESTED_APP_PORT);
        throw new Error(
            `NestedAuthAppSample servers did not start within ` +
                `${SERVER_READY_TIMEOUT_MS}ms (host:${hostUp} nested:${nestedUp}).`
        );
    }
};
