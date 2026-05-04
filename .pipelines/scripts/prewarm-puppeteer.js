// Launches and immediately closes a Puppeteer/Chrome instance so that the
// browser binary is unpacked and cached before tests run.  Errors here are
// non-fatal: the step is run with continueOnError: true in CI.
//
// require() resolves modules relative to this script file's directory, not
// process.cwd(). Since puppeteer is installed in the sample's node_modules
// (the pipeline sets cwd to the sample path), we resolve from cwd instead.
const { createRequire } = require("module");
const requireFromCwd = createRequire(require("path").join(process.cwd(), "package.json"));
Promise.resolve()
    .then(() => requireFromCwd("puppeteer"))
    .then((puppeteer) => puppeteer.launch({ headless: true, timeout: 120000 }))
    .then((b) =>
        b.close().catch((e) => {
            if (e.code === "EBUSY")
                console.warn(
                    "[pre-warm] Chrome temp profile cleanup hit a file lock (non-fatal on Windows):",
                    e.message
                );
            else if (
                e.message &&
                (e.message.includes("Target closed") ||
                    e.message.includes("Protocol error"))
            )
                console.warn(
                    "[pre-warm] Chrome exited before close() completed (non-fatal):",
                    e.message
                );
            else
                console.warn(
                    "[pre-warm] Unexpected browser cleanup error (non-fatal, tests will still run):",
                    e.message
                );
        })
    )
    .then(() => console.log("Browser ready"))
    .catch((e) => {
        console.error(
            "[pre-warm] Browser launch failed (non-fatal, tests will still run):",
            e.message
        );
        process.exit(1);
    });
