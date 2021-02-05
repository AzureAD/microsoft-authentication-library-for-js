const serverUtils = require("./serverUtils");
const path = require("path");

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

    // Optional __TIMEOUT__ parameter or default to 30 seconds
    const timeoutMs = jestConfig.globals.__TIMEOUT__ || 30000;

    console.log(`Starting Server for: ${sampleName} on port ${port}`);
    process.env.PORT = port;
    let serverOutput = "";
    const serverCallback = (error, stdout, stderr) => {
        if (error) {
            serverOutput += error;
        } 
        if (stderr) {
            serverOutput += stderr;
        }
        if (stdout) {
            serverOutput += stdout;
        }
    };
    serverUtils.startServer(startCommand, jestConfig.rootDir, serverCallback);

    const serverUp = await serverUtils.isServerUp(port, timeoutMs);
    if (serverUp) {
        console.log(`Server for ${sampleName} running on port ${port}`);
    } else {
        console.error(`Unable to start server for ${sampleName} on port ${port}`);
        console.log(serverOutput);
        throw new Error();
    }
}

module.exports = async (jestOptions) => {
    console.log(""); // Create new line
    if(jestOptions.projects && jestOptions.projects.length > 0) {
        const servers = [];
        jestOptions.projects.forEach((project) => {
            const jestConfig = require(path.resolve(project, "jest.config.js"));
            servers.push(startServer(jestConfig));
        });

        await Promise.all(servers).catch(async () => {
            await serverUtils.killServers(jestOptions);
            process.exit(1);
        });
    } else {
        const jestConfig = require(path.resolve(jestOptions.rootDir, "jest.config.js"));
        await startServer(jestConfig).catch(async () => {
            await serverUtils.killServers(jestOptions);
            process.exit(1)
        });
    } 
}