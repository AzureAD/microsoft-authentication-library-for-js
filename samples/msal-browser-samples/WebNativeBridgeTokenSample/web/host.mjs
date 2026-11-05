import { WebTokenExecutor } from "./executor.mjs";
import { HostProjection } from "./host-projection.mjs";

const element = name => document.getElementById(name);
if (window.top !== window) throw new Error("top_level_host_required");
const config = window.webPocConfig;
const configuration = {
    auth: { clientId: config.host.clientId, authority: config.authority, redirectUri: config.host.redirectUri },
    cache: { cacheLocation: "memoryStorage" },
    system: { allowPlatformBroker: false, loggerOptions: { piiLoggingEnabled: false, loggerCallback: () => {} } },
};
const pca = new msal.PublicClientApplication(configuration);
const executor = new WebTokenExecutor(pca, { authority: config.authority, refreshTokenAndNetwork: msal.CacheLookupPolicy.RefreshTokenAndNetwork, registrationConfirmed: config.registrationConfirmed, testSlice: config.testSlice });
const projection = new HostProjection(executor, { getAccount: () => pca.getActiveAccount() });
const receive = event => { void projection.receive(event); };
window.addEventListener("message", receive);
window.addEventListener("pagehide", () => { projection.dispose(); window.removeEventListener("message", receive); }, { once: true });
window.addEventListener("pageshow", event => { if (event.persisted) window.location.reload(); });

function select(index) {
    for (let current = 0; current < 2; current++) {
        const selected = current === index;
        const tab = element(`tab${current + 1}`);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        element(`panel${current + 1}`).hidden = !selected;
    }
}
for (let index = 0; index < 2; index++) {
    const tab = element(`tab${index + 1}`);
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
        select(next);
        element(`tab${next + 1}`).focus();
    });
}

function update() {
    element("account").textContent = pca.getActiveAccount() ? "Host account selected" : "Signed out";
    element("status").textContent = "Web Host Ready";
}

element("signin").addEventListener("click", async () => {
    if (config.registrationConfirmed !== true) {
        element("outcome").textContent = "registration_not_confirmed";
        return;
    }
    element("signin").disabled = true;
    element("reset").disabled = true;
    projection.reset();
    try {
        const request = { scopes: ["openid", "profile"], prompt: "select_account",
            ...(config.testSlice ? { extraQueryParameters: { dc: config.testSlice } } : {}) };
        const result = await pca.loginPopup(request);
        pca.setActiveAccount(result.account);
        projection.reset();
        update();
        element("outcome").textContent = "Host signed in";
    } catch (error) {
        const code = typeof error?.errorCode === "string" ? error.errorCode : "unknown_error";
        const subError = typeof error?.subError === "string" && error.subError ? ` (${error.subError})` : "";
        element("outcome").textContent = `Host sign-in unavailable or cancelled: ${code}${subError}`;
    }
    finally { element("signin").disabled = false; element("reset").disabled = false; }
});

element("reset").addEventListener("click", async () => {
    element("signin").disabled = true;
    element("reset").disabled = true;
    projection.reset();
    pca.setActiveAccount(null);
    try {
        await pca.clearCache();
        projection.reset();
        update();
        element("outcome").textContent = "Local session reset";
    } catch { element("outcome").textContent = "Local session reset failed"; }
    finally { element("signin").disabled = false; element("reset").disabled = false; }
});

try {
    await pca.initialize();
    for (let index = 0; index < 2; index++) {
        const child = config.children[index];
        const panel = element(`panel${index + 1}`);
        if (child.active === false) {
            const placeholder = document.createElement("p");
            placeholder.textContent = child.name;
            panel.append(placeholder);
            continue;
        }
        const frame = document.createElement("iframe");
        frame.id = `child${index + 1}`;
        frame.title = child.name;
        frame.referrerPolicy = "no-referrer";
        frame.addEventListener("load", () => projection.attach(frame, child));
        frame.src = `${child.origin}/`;
        panel.append(frame);
    }
    update();
    element("outcome").textContent = "Ready";
    element("signin").disabled = false;
    element("reset").disabled = false;
} catch { element("status").textContent = "Unavailable"; element("outcome").textContent = "Host initialization failed"; }