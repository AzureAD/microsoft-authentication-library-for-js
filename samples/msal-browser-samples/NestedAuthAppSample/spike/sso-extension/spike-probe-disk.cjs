/*
 * Probe: launch branded Chrome with a fresh profile (force-install flags kept
 * enabled) and watch the on-disk Extensions folder to see whether the
 * force-listed SSO extension CRX actually lands in a throwaway userDataDir.
 */
const puppeteer = require("puppeteer");
const path = require("path");
const os = require("os");
const fs = require("fs");

const EXT = process.env.SSO_EXTENSION_ID || "ppnbnpeolgkicgegkbkbjmhlideopiji";
const CHROME =
    process.env.CHROME_EXECUTABLE_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function listExtensions(userDataDir) {
    const base = path.join(userDataDir, "Default", "Extensions");
    try {
        return fs.readdirSync(base);
    } catch {
        return [];
    }
}

(async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "naa-probe-"));
    const t0 = Date.now();
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            executablePath: CHROME,
            userDataDir,
            ignoreDefaultArgs: [
                "--disable-extensions",
                "--disable-background-networking",
                "--disable-component-extensions-with-background-pages",
                "--disable-default-apps",
                "--disable-sync",
            ],
            args: ["--no-first-run", "--no-default-browser-check"],
        });

        // Open a normal page so the profile initializes fully.
        const page = await browser.newPage();
        await page.goto("chrome://policy", { waitUntil: "domcontentloaded" }).catch(() => {});

        let landed = false;
        let allExt = [];
        for (let i = 0; i < 60 && !landed; i++) {
            allExt = listExtensions(userDataDir);
            landed = allExt.includes(EXT);
            if (!landed) await new Promise((r) => setTimeout(r, 1000));
        }

        console.log(
            JSON.stringify(
                {
                    probe: "on-disk-extensions",
                    elapsedMs: Date.now() - t0,
                    ssoExtensionLanded: landed,
                    allExtensionIdsOnDisk: allExt,
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
    console.error("PROBE ERROR:", e.message);
    process.exit(1);
});
