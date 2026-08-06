const path = require("path");
const serverUtils = require("../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const { HOST_APP_PORT, NESTED_APP_PORT } = require("./sampleConfig.cjs");

// Load manual-testing configuration from `.env`. For e2e runs the jest start
// command wraps this process with `env-cmd -f .env.e2e`, which pre-populates
// process.env; dotenv does not override already-set variables, so `.env.e2e`
// wins during e2e while `.env` supplies the defaults for `npm start`.
require("dotenv").config();

// Nested (child) app is embedded in an iframe by the host.
const nestedAppPort = NESTED_APP_PORT;
// Host (top frame) app enables the platform broker and exposes the Nested App
// Authentication bridge to the embedded nested app.
const hostAppPort = HOST_APP_PORT;
const useHttps = process.argv.includes("--https");
const startCommand = useHttps ? "npm run start:https" : "npm start";
const protocol = useHttps ? "https" : "http";

// Reuse the shared e2e spawn helper (used by the jest setup for every sample)
// so process spawning/logging stays consistent; this file only adds the
// two-app orchestration and coordinated shutdown on top of it.
const nestedServer = serverUtils.startServer(
    startCommand,
    path.join(__dirname, "nestedApp"),
    nestedAppPort
);
const hostServer = serverUtils.startServer(
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
