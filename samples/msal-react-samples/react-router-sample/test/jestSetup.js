const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const path = require('path');

module.exports = async (jestConfig) => {
    const parent = path.resolve(__dirname, "..");
    const sampleName = parent.split(path.sep).pop();
    console.log(`Starting Server for: ${sampleName}`);
    const port = serverUtils.getPortForProject(jestConfig.projects, sampleName);
    process.env.PORT = port;
    serverUtils.startServer("npm start", __dirname);
    const serverUp = await serverUtils.isServerUp(port, 15000);
    if (serverUp) {
        console.log(`Server for ${sampleName} running on port ${port}`);
    } else {
        console.error(`Unable to start server for ${sampleName} on port ${port}`);
    }
}