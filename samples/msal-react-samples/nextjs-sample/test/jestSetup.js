const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

module.exports = async (jestConfig) => {
    const folders = __dirname.split("\\");
    const sampleName = folders[folders.length - 2];
    console.log(`Starting Server for: ${sampleName}`);
    const port = serverUtils.getPortForProject(jestConfig.projects, sampleName);
    serverUtils.startServer(`npm run dev -- -p ${port}`, __dirname);
    const serverUp = await serverUtils.isServerUp(port, 15000);
    if (serverUp) {
        console.log(`Server for ${sampleName} running on port ${port}`);
    } else {
        console.error(`Unable to start server for ${sampleName} on port ${port}`);
    }
}