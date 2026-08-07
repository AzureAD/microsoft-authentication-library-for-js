/*
 * Spike: can Puppeteer launch branded Chrome with a fresh profile and have the
 * force-installed Microsoft SSO extension (canonical id) materialize?
 */
const puppeteer = require("puppeteer");
const path = require("path");
const os = require("os");
const fs = require("fs");

const EXT = process.env.SSO_EXTENSION_ID || "ppnbnpeolgkicgegkbkbjmhlideopiji";
const CHROME =
    process.env.CHROME_EXECUTABLE_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "naa-pptr-"));
    const t0 = Date.now();
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: process.env.PPTR_HEADLESS === "new" ? true : false,
            executablePath: CHROME,
            userDataDir,
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
                    tool: "puppeteer",
                    headless:
                        process.env.PPTR_HEADLESS === "new" ? "new(true)" : false,
                    launchedMs,
                    extensionDetected: found,
                    firstSeenMs,
                },
                null,
                2
            )
        );
    } finally {
        if (browser) await browser.close();
        fs.rmSync(userDataDir, { recursive: true, force: true });
    }
})().catch((e) => {
    console.error("PUPPETEER ERROR:", e.message);
    process.exit(1);
});
