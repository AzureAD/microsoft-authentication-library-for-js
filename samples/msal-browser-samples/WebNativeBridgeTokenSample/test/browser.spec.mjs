import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { root, stage } from "../scripts/stage.mjs";
import { route as sampleRoute, validateSettings } from "../scripts/server.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BRIDGE_PLAYWRIGHT || path.resolve(root, "../../../node_modules/playwright"));

test("HTTPS root host keeps two slots with one real child and no placeholder iframe or authentication", { timeout: 45000 }, async () => {
    stage();
    const settings = validateSettings(JSON.parse(fs.readFileSync(path.join(root, "settings.example.json"))));
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    try {
        const context = await browser.newContext();
        const unexpected = [], errors = [], loaded = [];
        await context.route("**/*", requestRoute => {
            const url = new URL(requestRoute.request().url());
            loaded.push(url.origin);
            if (![settings.host.origin, settings.children[1].origin].includes(url.origin)) {
                unexpected.push(url.origin);
                return requestRoute.abort();
            }
            return requestRoute.fulfill(sampleRoute(settings, url.origin, url.pathname));
        });
        const page = await context.newPage();
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(`${settings.host.origin}/`);
        await page.locator("#status").filter({ hasText: "Web Host Ready" }).waitFor();
        assert.equal(await page.locator('[role="tab"]').count(), 2);
        assert.equal(await page.locator("iframe").count(), 1);
        assert.equal(await page.locator("#child1").count(), 0);
        assert.equal(await page.locator("#panel1").textContent(), "Inactive app");
        await page.locator("#signin").click();
        await page.locator("#outcome").filter({ hasText: "registration_not_confirmed" }).waitFor();
        await page.locator("#tab2").click();
        const child = page.frameLocator("#child2");
        await child.locator("#status").filter({ hasText: "Native Bridge Connected" }).waitFor();
        for (const method of ["interactive", "silent"]) {
            await child.locator(`#${method}`).click();
            await child.locator("#outcome").filter({ hasText: "registration_not_confirmed" }).waitFor();
            assert.equal(JSON.parse(await child.locator("#bridge-request").textContent()).tokenParams.clientId, settings.children[1].clientId);
            assert.equal(await child.locator("#graph").isDisabled(), true);
        }
        for (const width of [1200, 390]) {
            await page.setViewportSize({ width, height: 900 });
            for (const slot of [1, 2]) {
                await page.locator(`#tab${slot}`).click();
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                await page.screenshot({ path: path.join(root, `artifacts/web-placeholder-${slot}-${width}.png`), fullPage: true });
            }
        }
        assert.equal(loaded.includes("https://localhost:7444"), false);
        assert.deepEqual(unexpected, []);
        assert.deepEqual(errors, []);
    } finally { await browser.close(); }
});

test("launcher serves actual localhost pages and gates unconfirmed authentication", { timeout: 45000 }, async testContext => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "web-bridge-browser-"));
    testContext.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const settings = JSON.parse(fs.readFileSync(path.join(root, "test/settings.fixture.json")));
    const ports = [17443, 17444, 17445];
    for (const [index, app] of [settings.host, ...settings.children].entries()) {
        app.origin = `http://localhost:${ports[index]}`;
        app.redirectUri = index === 0 ? `${app.origin}/redirect.html` : `brk-multihub://localhost:${ports[index]}`;
    }
    const settingsPath = path.join(directory, "settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
    const launcher = spawn(process.execPath, [path.join(root, "scripts/launch.mjs"), "--settings", settingsPath], { cwd: path.dirname(root), stdio: ["ignore", "pipe", "pipe"] });
    let browser;
    let output = "";
    try {
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Launcher startup timeout: ${output}`)), 10000);
            launcher.stdout.on("data", bytes => {
                output += bytes;
                if (output.includes("registration_not_confirmed")) { clearTimeout(timer); resolve(); }
            });
            launcher.stderr.on("data", bytes => { output += bytes; });
            launcher.once("error", error => { clearTimeout(timer); reject(error); });
            launcher.once("exit", code => { clearTimeout(timer); reject(new Error(`Launcher exited ${code}: ${output}`)); });
        });
        assert.ok(output.includes(`Web host: ${settings.host.origin}`));
        const request = (port, host, pathname, method = "GET") => new Promise((resolve, reject) => {
            const call = http.request({ hostname: "127.0.0.1", port, path: pathname, method, headers: { host } }, response => {
                let body = "";
                response.on("data", bytes => { body += bytes; });
                response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body }));
            });
            call.on("error", reject);
            call.end();
        });
        for (const port of ports) {
            const response = await request(port, `localhost:${port}`, "/");
            assert.equal(response.status, 200);
            assert.equal(response.headers["cache-control"], "no-store");
            assert.equal(response.headers["x-content-type-options"], "nosniff");
            assert.equal(response.headers["access-control-allow-origin"], undefined);
            assert.ok(response.headers["content-security-policy"].includes(port === ports[0] ? "frame-ancestors 'none'" : `frame-ancestors ${settings.host.origin}`));
            for (const host of ["evil.example", "127.0.0.1:" + port, `localhost:${port === ports[0] ? ports[1] : ports[0]}`]) assert.equal((await request(port, host, "/")).status, 404);
            for (const pathname of ["/settings.json", "/settings.example.json", "/missing-key.pem", "/../scripts/server.mjs", "/%2e%2e/settings.json"]) assert.equal((await request(port, `localhost:${port}`, pathname)).status, 404);
            assert.equal((await request(port, `localhost:${port}`, "/", "POST")).status, 405);
        }
        assert.equal((await request(ports[1], `localhost:${ports[1]}`, "/executor.mjs")).status, 404);
        browser = await chromium.launch({ channel: "msedge", headless: true });
        const context = await browser.newContext();
        const external = [], errors = [];
        await context.route(/^https?:\/\/(?!localhost:1744[345](?:\/|$))/, route => { external.push(route.request().url()); return route.abort(); });
        const page = await context.newPage();
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(settings.host.origin);
        await page.locator("#status").filter({ hasText: "Web Host Ready" }).waitFor();
        assert.equal(await page.evaluate(() => isSecureContext), true);
        assert.equal(await page.locator("#account").textContent(), "Signed out");
        await page.locator("#signin").click();
        await page.locator("#outcome").filter({ hasText: "registration_not_confirmed" }).waitFor();
        for (let index = 0; index < 2; index++) {
            await page.locator(`#tab${index + 1}`).click();
            const child = page.frameLocator(`#child${index + 1}`);
            await child.locator("#status").filter({ hasText: "Native Bridge Connected" }).waitFor();
            assert.equal(await child.locator("body").evaluate(() => isSecureContext), true);
            for (const method of ["interactive", "silent"]) {
                await child.locator(`#${method}`).click();
                await child.locator("#outcome").filter({ hasText: "registration_not_confirmed" }).waitFor();
                assert.equal(await child.locator("#token").textContent(), "Not acquired");
                assert.equal(await child.locator("#graph").isDisabled(), true);
                assert.equal(await child.locator("#graph-result").textContent(), "Not called");
                const raw = JSON.parse(await child.locator("#bridge-request").textContent());
                assert.equal(raw.method, method === "interactive" ? "GetTokenPopup" : "GetToken");
                assert.equal(raw.tokenParams.clientId, settings.children[index].clientId);
            }
        }
        for (const width of [1200, 390]) {
            await page.setViewportSize({ width, height: 900 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.screenshot({ path: path.join(root, `artifacts/web-localhost-${width}.png`), fullPage: true });
        }
        assert.deepEqual(external, []);
        assert.deepEqual(errors, []);
    } finally {
        if (browser) await browser.close();
        if (launcher.exitCode === null) await new Promise(resolve => { launcher.once("exit", resolve); launcher.kill(); });
    }
});

test("actual two-child MSAL and compiled typed transport, Graph and privacy", async () => {
    stage();
    const settings = validateSettings({ ...JSON.parse(fs.readFileSync(path.join(root, "test/settings.fixture.json"))), registrationConfirmed: true });
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    try {
        const page = await browser.newPage();
        const errors = [], consoleMessages = [], unexpected = [], graph = [];
        const profile = { "@odata.context": "test-only-metadata", id: "test-only", displayName: "test-only Alex", mail: null, userPrincipalName: "test-only@example.test", jobTitle: null };
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => consoleMessages.push(message.text()));
        await page.addInitScript(() => {
            if (window.top !== window) return;
            window.__webBridgeTestPcaFactory = () => {
                let active = null;
                const account = { homeAccountId: "test-home.test-tenant", environment: "login.microsoftonline.com", tenantId: "22222222-2222-4222-8222-222222222222", localAccountId: "test-user" };
                window.testCalls = [];
                const acquire = async (request, method) => {
                    window.testCalls.push({ request, method });
                    if (window.testSilentError && method === "silent") throw Object.assign(new Error("DO-NOT-LOG-SDK-SECRET"), { errorCode: "interaction_required" });
                    const claims = { aud: request.embeddedClientId, tid: account.tenantId, oid: "22222222-2222-2222-2222-222222222222", sub: "test-user", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 };
                    return { accessToken: `EXPLICIT-TEST-ONLY-${request.embeddedClientId}`, idToken: `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify(claims)).replaceAll("=", "")}.test`, idTokenClaims: claims, account, scopes: request.scopes, authority: request.authority, expiresOn: new Date(Date.now() + 3600000) };
                };
                return { initialize: async () => {}, getActiveAccount: () => active, setActiveAccount: value => { active = value; }, getAllAccounts: () => [], loginPopup: async request => { window.testLoginRequest = request; return { account }; }, clearCache: async () => { active = null; }, acquireTokenPopup: request => acquire(request, "popup"), acquireTokenSilent: request => acquire(request, "silent") };
            };
        });
        await page.route("**/*", async route => {
            const url = new URL(route.request().url());
            if (url.origin === "https://graph.microsoft.com") {
                assert.equal(url.href, "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle");
                graph.push(route.request().headers().authorization);
                return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(profile) });
            }
            if (![settings.host.origin, ...settings.children.map(child => child.origin)].includes(url.origin)) { unexpected.push(url.href); return route.abort(); }
            const response = sampleRoute(settings, url.origin, url.pathname);
            if (url.pathname === "/host.mjs") {
                response.body = response.body.toString().replace("new msal.PublicClientApplication(configuration)", "window.__webBridgeTestPcaFactory(configuration)");
            }
            return route.fulfill(response);
        });
        await page.goto(settings.host.origin);
        await page.locator("#signin").click();
        await page.waitForFunction(() => document.getElementById("outcome").textContent === "Host signed in");
        assert.deepEqual(await page.evaluate(() => window.testLoginRequest.extraQueryParameters), { dc: settings.testSlice });
        try {
            await page.frameLocator("#child1").locator("#interactive").waitFor({ state: "visible", timeout: 10000 });
            await page.waitForFunction(() => document.getElementById("child1").contentWindow !== null);
        } catch (error) { console.error(errors, consoleMessages); throw error; }
        for (let index = 0; index < 2; index++) {
            await page.locator(`#tab${index + 1}`).click();
            const child = page.frameLocator(`#child${index + 1}`);
            try { await child.locator("#interactive").click({ timeout: 10000 }); }
            catch (error) { console.error({ errors, consoleMessages, outcome: await child.locator("#outcome").textContent(), events: await child.locator("#events").textContent() }); throw error; }
            try { await child.locator("#token").filter({ hasText: "Received" }).waitFor({ timeout: 10000 }); }
            catch (error) { console.error({ errors, outcome: await child.locator("#outcome").textContent(), events: await child.locator("#events").textContent() }); throw error; }
            const popupRequest = JSON.parse(await child.locator("#bridge-request").textContent());
            assert.equal(popupRequest.method, "GetTokenPopup");
            assert.equal(popupRequest.tokenParams.clientId, settings.children[index].clientId);
            const popupResponse = await child.locator("#bridge-response").textContent();
            assert.equal(JSON.parse(popupResponse).requestId, popupRequest.requestId);
            assert.ok(popupResponse.includes(`EXPLICIT-TEST-ONLY-${settings.children[index].clientId}`));
            assert.ok(popupResponse.includes("eyJhbGciOiJub25lIn0."));
            assert.equal(await child.locator("#bridge-response > *").count(), 0);
            await child.locator("#silent").click();
            await child.locator("#token").filter({ hasText: "Received" }).waitFor();
            const silentRequest = JSON.parse(await child.locator("#bridge-request").textContent());
            assert.equal(silentRequest.method, "GetToken");
            assert.equal(silentRequest.tokenParams.clientId, settings.children[index].clientId);
            const silentResponse = await child.locator("#bridge-response").textContent();
            assert.equal(JSON.parse(silentResponse).requestId, silentRequest.requestId);
            assert.ok(silentResponse.includes(`EXPLICIT-TEST-ONLY-${settings.children[index].clientId}`));
            assert.ok(silentResponse.includes("eyJhbGciOiJub25lIn0."));
            await child.locator("#graph").click();
            await child.locator("#graph-result").filter({ hasText: "HTTP 200" }).waitFor();
            assert.equal(await child.locator("#graph-response-region").isVisible(), true);
            assert.equal(await child.locator("#graph-response").textContent(), JSON.stringify(profile, null, 2));
            assert.equal(await child.locator("#profile-name").textContent(), profile.displayName);
            assert.equal(await child.locator("#profile-email").textContent(), profile.userPrincipalName);
            assert.equal(await child.locator("#profile-job-title").textContent(), "Not provided");
            assert.equal(await child.locator("#graph-raw").evaluate(details => details.open), false);
            assert.equal((await child.locator("#events").textContent()).includes("EXPLICIT-TEST-ONLY"), false);
            assert.equal((await child.locator("#events").textContent()).includes("test-only"), false);
        }
        const calls = await page.evaluate(() => window.testCalls);
        assert.deepEqual(calls.map(call => call.method), ["popup", "silent", "popup", "silent"]);
        assert.ok(calls.every(call => call.request.extraQueryParameters.dc === settings.testSlice));
        assert.deepEqual(calls.map(call => call.request.embeddedClientId), settings.children.flatMap(child => [child.clientId, child.clientId]));
        assert.deepEqual(graph, settings.children.map(child => `Bearer EXPLICIT-TEST-ONLY-${child.clientId}`));
        assert.ok(calls.every(call => call.request.storeInCache.accessToken === false && call.request.storeInCache.idToken === false));
        await page.evaluate(() => { window.testSilentError = true; });
        const second = page.frameLocator("#child2");
        await second.locator("#silent").click();
        await second.locator("#outcome").filter({ hasText: "interaction_required" }).waitFor();
        const errorResponse = JSON.parse(await second.locator("#bridge-response").textContent());
        assert.equal(errorResponse.success, false);
        assert.equal(errorResponse.error.code, "interaction_required");
        assert.equal((await second.locator("#bridge-response").textContent()).includes("EXPLICIT-TEST-ONLY"), false);
        assert.equal(await second.locator("#graph").isDisabled(), true);
        assert.equal(await second.locator("#graph-result").textContent(), "Not called");
        assert.equal(await second.locator("#graph-response-region").isVisible(), false);
        assert.equal(await second.locator("#graph-response").textContent(), "");
        for (const field of ["name", "email", "job-title"]) assert.equal(await second.locator(`#profile-${field}`).textContent(), "");
        for (const width of [1200, 390]) {
            await page.setViewportSize({ width, height: 900 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.screenshot({ path: path.join(root, `artifacts/web-${width}.png`), fullPage: true });
        }
        await page.evaluate(() => { window.testSilentError = false; });
        await second.locator("#interactive").click();
        await second.locator("#token").filter({ hasText: "Received" }).waitFor();
        await second.locator("#graph").click();
        await second.locator("#graph-result").filter({ hasText: "HTTP 200" }).waitFor();
        for (const frame of page.frames().filter(frame => frame !== page.mainFrame())) {
            await frame.evaluate(() => { window.staleChildContext = true; });
        }
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false })));
        assert.equal(await second.locator("#graph-result").textContent(), "HTTP 200");
        await Promise.all([
            page.waitForRequest(request => request.isNavigationRequest() && request.frame() === page.mainFrame() && request.url() === `${settings.host.origin}/`, { timeout: 5000 }),
            page.evaluate(() => {
                window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
                window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
            }),
        ]);
        await page.locator("#outcome").filter({ hasText: "Ready" }).waitFor();
        assert.equal(await page.locator("#account").textContent(), "Signed out");
        assert.deepEqual(await page.evaluate(() => window.testCalls), []);
        for (let index = 0; index < 2; index++) {
            await page.locator(`#tab${index + 1}`).click();
            const child = page.frameLocator(`#child${index + 1}`);
            await child.locator("#status").filter({ hasText: "Native Bridge Connected" }).waitFor();
            assert.equal(await child.locator("#token").textContent(), "Not acquired");
            assert.equal(await child.locator("#graph-result").textContent(), "Not called");
            assert.equal(await child.locator("#graph").isDisabled(), true);
            assert.equal(await child.locator("#graph-response-region").isVisible(), false);
            assert.equal(await child.locator("#graph-response").textContent(), "");
            for (const field of ["name", "email", "job-title"]) assert.equal(await child.locator(`#profile-${field}`).textContent(), "");
            assert.equal(await child.locator("#bridge-request").textContent(), "");
            assert.equal(await child.locator("#bridge-response").textContent(), "");
            assert.equal(await child.locator("#bridge-response-region").isVisible(), false);
            assert.equal(await child.locator("body").evaluate(() => window.staleChildContext), undefined);
        }
        await page.locator("#signin").click();
        await page.locator("#outcome").filter({ hasText: "Host signed in" }).waitFor();
        for (let index = 0; index < 2; index++) {
            await page.locator(`#tab${index + 1}`).click();
            const child = page.frameLocator(`#child${index + 1}`);
            await child.locator("#interactive").click();
            await child.locator("#token").filter({ hasText: "Received" }).waitFor();
            await child.locator("#graph").click();
            await child.locator("#graph-result").filter({ hasText: "HTTP 200" }).waitFor();
            assert.equal(await child.locator("#graph-response").textContent(), JSON.stringify(profile, null, 2));
        }
        await page.locator("#reset").click();
        await page.locator("#account").filter({ hasText: "Signed out" }).waitFor();
        for (let index = 0; index < 2; index++) {
            const child = page.frameLocator(`#child${index + 1}`);
            await child.locator("#token").filter({ hasText: "Not acquired" }).waitFor({ state: "attached" });
            assert.equal(await child.locator("#graph").isDisabled(), true);
            assert.equal(await child.locator("#graph-result").textContent(), "Not called");
            assert.equal(await child.locator("#graph-response-region").isVisible(), false);
            assert.equal(await child.locator("#graph-response").textContent(), "");
            for (const field of ["name", "email", "job-title"]) assert.equal(await child.locator(`#profile-${field}`).textContent(), "");
            assert.equal(await child.locator("#bridge-request").textContent(), "");
            assert.equal(await child.locator("#bridge-response").textContent(), "");
            assert.equal(await child.locator("#bridge-response-region").isVisible(), false);
        }
        assert.equal(consoleMessages.join("\n").includes("EXPLICIT-TEST-ONLY"), false);
        assert.equal(consoleMessages.join("\n").includes("eyJhbGciOiJub25lIn0."), false);
        assert.equal(consoleMessages.join("\n").includes("test-only"), false);
        assert.equal(consoleMessages.join("\n").includes("DO-NOT-LOG"), false);
        assert.deepEqual(unexpected, []);
        assert.deepEqual(errors, []);
    } finally { await browser.close(); }
});

test("host callback loads the staged UMD bridge and invokes its response handoff", async () => {
    const settings = validateSettings(JSON.parse(fs.readFileSync(path.join(root, "test/settings.fixture.json"))));
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.route("**/*", route => {
            const url = new URL(route.request().url());
            const response = sampleRoute(settings, url.origin, url.pathname);
            if (url.pathname === "/redirect-bridge.mjs") {
                response.body = response.body.toString() + "\nwindow.msalRedirectBridge.broadcastResponseToMainFrame = () => { window.testHandoffCalled = true; };";
            }
            return route.fulfill(response);
        });
        await page.goto(settings.host.redirectUri);
        await page.waitForLoadState("networkidle");
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => window.testHandoffCalled), true);
    } finally { await browser.close(); }
});

test("real host MSAL emits child client_id and host broker parameters on authorize", async () => {
    const settings = validateSettings({ ...JSON.parse(fs.readFileSync(path.join(root, "test/settings.fixture.json"))), registrationConfirmed: true });
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    try {
        const context = await browser.newContext();
        const authorizations = [];
        await context.route("**/*", async route => {
            const url = new URL(route.request().url());
            if (url.hostname === "login.microsoftonline.com") {
                if (url.pathname.endsWith("/authorize")) {
                    authorizations.push(url);
                    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Test-only authorize capture</title>" });
                }
                if (url.pathname.includes("openid-configuration")) return route.fulfill({ json: {
                    authorization_endpoint: `${settings.authority}/oauth2/v2.0/authorize`, token_endpoint: `${settings.authority}/oauth2/v2.0/token`, end_session_endpoint: `${settings.authority}/oauth2/v2.0/logout`, issuer: `https://login.microsoftonline.com/${settings.tenantId}/v2.0`, jwks_uri: `${settings.authority}/discovery/v2.0/keys`,
                } });
                return route.fulfill({ json: { tenant_discovery_endpoint: `${settings.authority}/v2.0/.well-known/openid-configuration`, metadata: [{ preferred_network: "login.microsoftonline.com", preferred_cache: "login.windows.net", aliases: ["login.microsoftonline.com", "login.windows.net", "sts.windows.net"] }] } });
            }
            const response = sampleRoute(settings, url.origin, url.pathname);
            if (url.pathname === "/host.mjs") response.body = response.body.toString() + "\nwindow.testActualPca = pca;";
            return route.fulfill(response);
        });
        const page = await context.newPage();
        await page.goto(settings.host.origin);
        await page.waitForFunction(() => !!window.testActualPca);
        const popupPromise = context.waitForEvent("page");
        await page.evaluate(({ settings }) => {
            window.testAuthorizeDone = false;
            window.testActualPca.acquireTokenPopup({ scopes: ["User.Read"], authority: settings.authority, embeddedClientId: settings.children[0].clientId, redirectUri: settings.children[0].redirectUri, storeInCache: { accessToken: false, idToken: false }, skipBrokerClaims: true, extraQueryParameters: { dc: settings.testSlice } }).catch(() => {}).finally(() => { window.testAuthorizeDone = true; });
        }, { settings });
        const popup = await popupPromise;
        await popup.waitForURL(url => url.pathname.endsWith("/authorize"));
        assert.equal(authorizations.length, 1);
        const params = authorizations[0].searchParams;
        assert.equal(params.get("dc"), settings.testSlice);
        assert.equal(params.get("client_id"), settings.children[0].clientId);
        assert.equal(params.get("brk_client_id"), settings.host.clientId);
        assert.equal(params.get("brk_redirect_uri"), settings.host.redirectUri);
        assert.equal(params.get("redirect_uri"), settings.children[0].redirectUri);
        await popup.close();
    } finally { await browser.close(); }
});