const { spawn } = require("child_process");
const path = require("path");

// Load manual-testing configuration from `.env`. For e2e runs the jest start
// command wraps this process with `env-cmd -f .env.e2e`, which pre-populates
// process.env; dotenv does not override already-set variables, so `.env.e2e`
// wins during e2e while `.env` supplies the defaults for `npm start`.
require("dotenv").config();

/**
 * Spawns a child process to serve one of the sample apps.
 *
 * @param {string} cmd - command to run (e.g. "npm start")
 * @param {string} directory - working directory of the app
 * @param {number} port - port the app should listen on
 * @param {object} [env] - extra environment variables
 * @returns {import("child_process").ChildProcess}
 */
function startServer(cmd, directory, port, env) {
    const serverProcess = spawn(cmd, {
        shell: true,
        cwd: directory,
        env: { ...process.env, ...env, PORT: port.toString() },
    });
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
    return serverProcess;
}

// Nested (child) app runs on port 30667 and is embedded in an iframe by the host.
const nestedAppPort = 30667;
// Host (top frame) app runs on port 30668. It enables the platform broker and
// exposes the Nested App Authentication bridge to the embedded nested app.
const hostAppPort = 30668;
const useHttps = process.argv.includes("--https");
const startCommand = useHttps ? "npm run start:https" : "npm start";
const protocol = useHttps ? "https" : "http";

const nestedServer = startServer(
    startCommand,
    path.join(__dirname, "nestedApp"),
    nestedAppPort
);
const hostServer = startServer(
    startCommand,
    path.join(__dirname, "hostApp"),
    hostAppPort,
    {
        VITE_NESTED_APP_PORT: nestedAppPort.toString(),
        VITE_NESTED_APP_PROTOCOL: protocol,
    }
);

let isShuttingDown = false;

function shutdown(exitCode = 0) {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;

    [hostServer, nestedServer].forEach((server) => {
        if (!server.killed) {
            server.kill();
        }
    });

    setTimeout(() => process.exit(exitCode), 1000).unref();
}

hostServer.on("close", (code) => shutdown(code ?? 0));
nestedServer.on("close", (code) => shutdown(code ?? 0));
process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
