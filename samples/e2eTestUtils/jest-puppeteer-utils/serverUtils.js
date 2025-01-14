/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { spawn } = require("child_process");
const http = require("http");
const https = require("https");
const find = require("find-process");
const path = require("path");

/**
 * Returns boolean true/false if the given port is currently serving
 */
async function isServerUp(port, timeout) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (Date.now() - startTime > timeout) {
                resolve(false);
                clearInterval(interval);
                return;
            }

            const requestIPv4 = {
                protocol: "http:",
                host: "localhost",
                port: port,
                family: 4,
            };

            http.get(requestIPv4, (res) => {
                const { statusCode } = res;

                if (statusCode === 200) {
                    resolve(true);
                    clearInterval(interval);
                }
            }).on("error", (e) => {
                // errors will be raised until the server is up. Ignore errors
            });

            const requestHttpsIPv4 = {
                protocol: "https:",
                host: "localhost",
                port: port,
                family: 4,
                rejectUnauthorized: false, // codeql[js/disabling-certificate-validation]: This line is necessary for first-party HTTPS samples using self-signed SSL certificates. It is safe to ignore this finding as it is only used in MSAL.js samples and never hits the production environment.
            };

            https
                .get(requestHttpsIPv4, (res) => {
                    const { statusCode } = res;

                    if (statusCode === 200) {
                        resolve(true);
                        clearInterval(interval);
                    }
                })
                .on(
                    "error",
                    (e) => {
                        // errors will be raised until the server is up. Ignore errors
                    },
                    100
                );

            // Sometimes samples may be hosted in IPv6 instead - check that too
            const requestIPv6 = {
                protocol: "http:",
                host: "localhost",
                port: port,
                family: 6,
            };

            http.get(requestIPv6, (res) => {
                const { statusCode } = res;

                if (statusCode === 200) {
                    resolve(true);
                    clearInterval(interval);
                }
            }).on("error", (e) => {
                // errors will be raised until the server is up. Ignore errors
            });
        }, 100);
    });
}

/**
 * Spawns a child process to serve the sample
 */
function startServer(cmd, directory) {
    const serverProcess = spawn(cmd, { shell: true, cwd: directory });

    serverProcess.on("error", (err) => {
        console.error("Failed to start sample.");
        throw err;
    });

    serverProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });

    serverProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
    });

    serverProcess.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

/**
 * Kills all processes listening on a given port
 */
async function killServer(port) {
    return find("port", port).then((list) => {
        list.forEach((proc) => {
            console.log(`Killing server on port ${port}`);
            process.kill(proc.pid);
        });
    });
}

/**
 * Finds all ports configured for this jest run and kills all open servers on those ports
 */
async function killServers(jestOptions) {
    if (jestOptions.projects && jestOptions.projects.length > 0) {
        for (let i = 0; i < jestOptions.projects.length; i++) {
            const project = jestOptions.projects[i];
            const jestConfig = require(path.resolve(project, "jest.config.js"));
            const port = jestConfig.globals.__PORT__;
            await killServer(port);
        }
    } else {
        const jestConfig = require(path.resolve(
            jestOptions.rootDir,
            "jest.config.js"
        ));
        await killServer(jestConfig.globals.__PORT__);
    }
}

module.exports = {
    isServerUp,
    startServer,
    killServer,
    killServers,
};
