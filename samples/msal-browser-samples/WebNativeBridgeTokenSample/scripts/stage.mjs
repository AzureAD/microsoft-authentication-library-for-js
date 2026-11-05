import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));
function copy(input, target) {
    const bytes = fs.readFileSync(input);
    const matches = () => {
        try { return fs.readFileSync(target).equals(bytes); }
        catch (error) { if (error.code === "ENOENT") return false; throw error; }
    };
    if (matches()) return;
    const temporary = `${target}.${process.pid}.tmp`;
    try {
        fs.writeFileSync(temporary, bytes);
        try { fs.renameSync(temporary, target); }
        catch (error) { if (!matches()) throw error; }
    } finally { fs.rmSync(temporary, { force: true }); }
}

export function stage() {
    const child = path.join(root, "artifacts/child");
    fs.mkdirSync(child, { recursive: true });
    for (const name of ["index.html", "app.js", "styles.css"]) {
        copy(path.join(root, "../NativeBridgeTokenSample/web", name), path.join(child, name));
    }
    copy(path.join(root, "../../../lib/msal-bridge/dist/msal-bridge.js"), path.join(root, "artifacts/msal-bridge.js"));
    const threeP = process.env.THREE_P_REPO || path.resolve(root, "../../..");
    copy(path.join(threeP, "lib/msal-browser/lib/msal-browser.js"), path.join(child, "msal-browser.js"));
    copy(path.join(threeP, "lib/msal-browser/lib/msal-browser.js"), path.join(root, "artifacts/host-msal.js"));
    copy(path.join(threeP, "lib/msal-browser/lib/redirect-bridge/msal-redirect-bridge.js"), path.join(root, "artifacts/redirect-bridge.mjs"));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    stage();
    console.log("Staged unchanged child, compiled transport and actual host MSAL assets.");
}