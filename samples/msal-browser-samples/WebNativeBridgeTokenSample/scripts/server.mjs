import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { root } from "./stage.mjs";

export function loadSettings(options = {}, baseDirectory = root) {
    const local = path.join(baseDirectory, "settings.json");
    const fallback = !options.settings && !fs.existsSync(local);
    const input = JSON.parse(fs.readFileSync(options.settings || (fallback ? path.join(baseDirectory, "settings.example.json") : local), "utf8"));
    if (fallback && (options.cert !== undefined || options.key !== undefined) && input.host.origin.startsWith("http:")) {
        const redirectPath = new URL(input.host.redirectUri).pathname;
        for (const app of [input.host, ...activeChildren(input)]) app.origin = app.origin.replace("http:", "https:");
        input.host.redirectUri = `${input.host.origin}${redirectPath}`;
    }
    return validateSettings(input);
}

const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const activeChildren = settings => settings.children.filter(child => child.active !== false);
export function validateSettings(input) {
    const settings = structuredClone(input);
    if (settings.testSlice !== undefined && (typeof settings.testSlice !== "string" || !/^[a-zA-Z0-9-]{1,128}$/.test(settings.testSlice))) throw new Error("Invalid TestSlice scale-unit name");
    settings.registrationConfirmed = settings.registrationConfirmed === true;
    if (!guid.test(settings.tenantId) || !guid.test(settings.host?.clientId) || settings.children?.length !== 2) throw new Error("Invalid host, tenant or children");
    settings.tenantId = settings.tenantId.toLowerCase();
    const origins = new Set();
    const protocol = new URL(settings.host.origin).protocol;
    for (const child of settings.children) {
        if (child.active !== undefined && typeof child.active !== "boolean") throw new Error("Invalid child active flag");
        if (child.active === false && (child.clientId !== "" || child.origin !== "" || child.redirectUri !== "" || !Array.isArray(child.scopes) || child.scopes.length || typeof child.name !== "string" || !child.name.length || child.name.length > 64)) throw new Error("Inactive child must be an empty placeholder");
    }
    if (!activeChildren(settings).length) throw new Error("At least one configured child required");
    for (const app of [settings.host, ...activeChildren(settings)]) {
        const url = new URL(app.origin);
        const trusted = url.protocol === "http:" ? url.hostname === "localhost" : url.protocol === "https:" && ["localhost", "bridge-poc.local", "app2.bridge-poc.local", "host.bridge-poc.local"].includes(url.hostname);
        if (!trusted || url.protocol !== protocol || url.origin !== app.origin || origins.has(app.origin) || !guid.test(app.clientId)) throw new Error("Distinct same-scheme trusted origins required; HTTP requires literal localhost");
        app.clientId = app.clientId.toLowerCase();
        origins.add(app.origin);
    }
    const clients = new Set([settings.host.clientId]);
    if (![`${settings.host.origin}/redirect.html`, `${settings.host.origin}/`].includes(settings.host.redirectUri)) throw new Error("Host redirect mismatch");
    settings.authority = `https://login.microsoftonline.com/${settings.tenantId}`;
    for (const child of activeChildren(settings)) {
        if (clients.has(child.clientId) || child.redirectUri !== `brk-multihub://${new URL(child.origin).host}` || !Array.isArray(child.scopes) || !child.scopes.length || child.scopes.some(scope => typeof scope !== "string" || !/^[a-zA-Z0-9./:_-]{1,256}$/.test(scope)) || typeof child.name !== "string" || child.name.length > 64) throw new Error("Child redirect, identity or scopes invalid");
        clients.add(child.clientId);
        child.authority = settings.authority;
    }
    return settings;
}

export function tlsOptions({ cert, key }) {
    if (!cert || !key) throw new Error("Explicit TLS cert and key paths required");
    return { cert: fs.readFileSync(cert), key: fs.readFileSync(key), minVersion: "TLSv1.2" };
}

export function route(settings, origin, pathname) {
    const child = activeChildren(settings).find(app => app.origin === origin);
    const host = origin === settings.host.origin;
    const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
    const missing = () => ({ status: 404, headers, body: "Not found" });
    if (!host && !child) return missing();
    if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) return missing();
    pathname = new URL(pathname, origin).pathname;
    headers["content-security-policy"] = host
        ? `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self' https://login.microsoftonline.com; frame-src ${activeChildren(settings).map(app => app.origin).join(" ")} https://login.microsoftonline.com; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self' https://login.microsoftonline.com`
        : `default-src 'self'; script-src 'self'; style-src 'self'; connect-src https://graph.microsoft.com; frame-src 'none'; frame-ancestors ${settings.host.origin}; object-src 'none'; base-uri 'none'; form-action 'none'`;
    let body;
    let type = "text/javascript";
    if (pathname === "/config.js") {
        body = `window.webPocConfig=${JSON.stringify(host ? { host: settings.host, authority: settings.authority, children: settings.children, registrationConfirmed: settings.registrationConfirmed, testSlice: settings.testSlice } : { hostOrigin: settings.host.origin, child })};`;
    } else if (pathname === "/" || pathname === "/index.html") {
        type = "text/html";
        body = fs.readFileSync(path.join(root, host ? "web/index.html" : "artifacts/child/index.html"), "utf8");
        if (child) body = body.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, "").replace('<script src="msal-browser.js"', '<script src="/config.js"></script><script src="/child-transport.js"></script><script src="/msal-bridge.js"></script><script src="/child-bootstrap.js"></script><script src="msal-browser.js"');
    } else {
        const hostFiles = { "/entry.mjs": "web/entry.mjs", "/host.mjs": "web/host.mjs", "/executor.mjs": "web/executor.mjs", "/host-projection.mjs": "web/host-projection.mjs", "/host-protocol.mjs": "web/host-protocol.mjs", "/styles.css": "web/styles.css", "/msal-browser.js": "artifacts/host-msal.js", "/redirect.html": "web/redirect.html", "/redirect.mjs": "web/redirect.mjs", "/redirect-bridge.mjs": "artifacts/redirect-bridge.mjs" };
        const childFiles = { "/app.js": "artifacts/child/app.js", "/styles.css": "artifacts/child/styles.css", "/msal-browser.js": "artifacts/child/msal-browser.js", "/msal-bridge.js": "artifacts/msal-bridge.js", "/child-transport.js": "web/child-transport.js", "/child-bootstrap.js": "web/child-bootstrap.js" };
        const file = (host ? hostFiles : childFiles)[pathname];
        if (!file) return missing();
        body = fs.readFileSync(path.join(root, file));
        if (pathname.endsWith(".css")) type = "text/css";
        if (pathname.endsWith(".html")) type = "text/html";
    }
    headers["content-type"] = `${type}; charset=utf-8`;
    return { status: 200, headers, body };
}

export async function serve(settings, tls) {
    settings = validateSettings(settings);
    const secure = new URL(settings.host.origin).protocol === "https:";
    if (secure && (!tls?.cert || !tls?.key)) throw new Error("Explicit TLS cert and key paths required");
    if (!secure && tls !== undefined) throw new Error("Explicit TLS requires HTTPS settings; HTTP downgrade refused");
    const servers = [];
    const apps = [settings.host, ...activeChildren(settings)];
    const portOf = app => new URL(app.origin).port || (secure ? "443" : "80");
    try {
        for (const port of new Set(apps.map(portOf))) {
            const allowed = apps.filter(app => portOf(app) === port);
            const listener = (request, response) => {
                try {
                    if (request.method !== "GET") { response.writeHead(405).end(); return; }
                    const app = allowed.find(candidate => new URL(candidate.origin).host === request.headers.host);
                    if (!app) { response.writeHead(404, { "cache-control": "no-store" }).end("Not found"); return; }
                    const result = route(settings, app.origin, request.url);
                    response.writeHead(result.status, result.headers).end(result.body);
                } catch { response.writeHead(500, { "cache-control": "no-store" }).end("Sample configuration or staged asset unavailable"); }
            };
            const server = secure ? https.createServer(tls, listener) : http.createServer(listener);
            servers.push(server);
            await new Promise((resolve, reject) => { server.once("error", reject); server.listen(Number(port), "127.0.0.1", resolve); });
        }
        return servers;
    } catch (error) {
        for (const server of servers) server.close();
        throw error;
    }
}