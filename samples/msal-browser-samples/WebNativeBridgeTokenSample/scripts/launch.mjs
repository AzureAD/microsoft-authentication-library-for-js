import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import { stage } from "./stage.mjs";
import { loadSettings, tlsOptions, serve } from "./server.mjs";

const { values } = parseArgs({ options: { settings: { type: "string" }, cert: { type: "string" }, key: { type: "string" }, open: { type: "boolean", default: false } } });
let phase = "TLS";
try {
    const tls = values.cert !== undefined || values.key !== undefined ? tlsOptions(values) : undefined;
    phase = "settings";
    const settings = loadSettings(values);
    phase = "staging";
    stage();
    phase = "server";
    const servers = await serve(settings, tls);
    console.log(`Web host: ${settings.host.origin}`);
    console.log("Live broker authentication requires owner-approved registrations and service support.");
    if (!settings.registrationConfirmed) console.log("registration_not_confirmed: UI and bridge initialization available; authentication blocked.");
    const close = () => { for (const server of servers) server.close(); };
    process.once("SIGINT", close);
    process.once("SIGTERM", close);
    if (values.open) {
        const [command, args] = process.platform === "win32" ? ["rundll32.exe", ["url.dll,FileProtocolHandler", settings.host.origin]] : process.platform === "darwin" ? ["open", [settings.host.origin]] : ["xdg-open", [settings.host.origin]];
        const opener = spawn(command, args, { stdio: "ignore", detached: true, shell: false });
        opener.on("error", () => console.error("Auto-open unavailable; open the displayed URL."));
        opener.unref();
    }
} catch (error) {
    console.error(`${phase}: ${error.message}`);
    process.exitCode = 1;
}