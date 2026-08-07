/*
 * Spike: can Playwright launchPersistentContext with branded Chrome (channel
 * "chrome") auto-install the force-listed Microsoft SSO extension, in both
 * headful and headless=new modes?
 */
const { chromium } = require("playwright");
const path = require("path");
const os = require("os");
const fs = require("fs");

const EXT = process.env.SSO_EXTENSION_ID || "ppnbnpeolgkicgegkbkbjmhlideopiji";
const HEADLESS_MODE = process.env.PW_HEADLESS === "new"; // "new" -> headless:'new'

(async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "naa-pw-"));
    const t0 = Date.now();
    let context;
    try {
        context = await chromium.launchPersistentContext(userDataDir, {
            channel: "chrome",
            headless: HEADLESS_MODE ? true : false,
            // Strip the default flags that block force-installed extensions.
            ignoreDefaultArgs: [
                "--disable-extensions",
                "--disable-background-networking",
                "--disable-component-extensions-with-background-pages",
                "--disable-default-apps",
                "--disable-sync",
            ],
            args: ["--no-first-run", "--no-default-browser-check"],
        });
        const launchedMs = Date.now() - t0;

        const extDir = path.join(userDataDir, "Default", "Extensions");
        let found = false;
        let firstSeenMs = null;
        for (let i = 0; i < 40 && !found; i++) {
            let onDisk = [];
            try {
                onDisk = fs.readdirSync(extDir);
            } catch {
                onDisk = [];
            }
            found = onDisk.includes(EXT);
            if (found) firstSeenMs = Date.now() - t0;
            else await new Promise((r) => setTimeout(r, 1000));
        }

        console.log(
            JSON.stringify(
                {
                    tool: "playwright",
                    headless: HEADLESS_MODE ? "new(true)" : false,
                    launchedMs,
                    extensionDetected: found,
                    firstSeenMs,
                },
                null,
                2
            )
        );
    } finally {
        if (context) await context.close();
        fs.rmSync(userDataDir, { recursive: true, force: true });
    }
})().catch((e) => {
    console.error("PLAYWRIGHT ERROR:", e.message);
    process.exit(1);
});
