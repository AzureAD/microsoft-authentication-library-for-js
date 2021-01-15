const serverUtils = require("./serverUtils");

const ports = [];

async function startServer(jestConfig) {
    if (!jestConfig) {
        console.error("Unable to find jest config!");
        throw new Error();
    }

    const port = jestConfig.globals.__PORT__;
    if (!port) {
        console.error("No __PORT__ specified in jestConfig globals property!")
        throw new Error()
    } else if (ports.includes(port)) {
        console.error(`Port ${port} already in use by another sample!`)
        throw new Error();
    } else {
        ports.push(port);
    }

    const startCommand = jestConfig.globals.__STARTCMD__;
    if (!startCommand) {
        console.error("No __STARTCMD__ specified in jestConfig globals property!");
        throw new Error();
    }

    const sampleName = jestConfig.displayName;
    if (!sampleName) {
        console.error("No displayName specified in jestConfig!");
        throw new Error ();
    }

    console.log(`Starting Server for: ${sampleName}`);
    process.env.PORT = port;
    serverUtils.startServer(startCommand, jestConfig.rootDir);
    const serverUp = await serverUtils.isServerUp(port, 30000);
    if (serverUp) {
        console.log(`Server for ${sampleName} running on port ${port}`);
    } else {
        console.error(`Unable to start server for ${sampleName} on port ${port}`);
        throw new Error();
    }
}

module.exports = async (jestOptions) => {
    if(jestOptions.projects) {
        const servers = [];
        jestOptions.projects.forEach((project) => {
            const jestConfig = require(`${project}\\jest.config.js`);
            servers.push(startServer(jestConfig));
        });

        await Promise.all(servers).catch(() => process.exit(1));
    } else {
        const jestConfig = require(`${jestOptions.rootDir}\\jest.config.js`);
        await startServer(jestConfig).catch(() => process.exit(1));
    } 
}