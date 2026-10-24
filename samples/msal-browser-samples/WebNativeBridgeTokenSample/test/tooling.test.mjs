import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadSettings, validateSettings, route, tlsOptions, serve } from "../scripts/server.mjs";
import { stage } from "../scripts/stage.mjs";
import { WebTokenExecutor } from "../web/executor.mjs";
import { isAuthenticationReturn } from "../web/entry.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const example = () => JSON.parse(fs.readFileSync(path.join(root, "test/settings.fixture.json")));
const confirmed = () => ({ ...example(), registrationConfirmed: true });
test("requested HTTPS topology keeps the exact parent callback and empty first slot", () => {
    const settings = validateSettings(JSON.parse(fs.readFileSync(path.join(root, "settings.example.json"))));
    assert.equal(settings.host.clientId, "33333333-3333-4333-8333-333333333333");
    assert.equal(settings.host.origin, "https://localhost:30663");
    assert.equal(settings.host.redirectUri, "https://localhost:30663/");
    assert.equal(settings.registrationConfirmed, false);
    assert.deepEqual(settings.children[0], { active: false, name: "Inactive app", clientId: "", origin: "", redirectUri: "", scopes: [] });
    assert.equal(settings.children[1].clientId, "44444444-4444-4444-8444-444444444444");
    assert.equal(settings.children[1].redirectUri, "brk-multihub://localhost:7445");
    assert.equal(route(settings, "https://localhost:7444", "/").status, 404);
});
test("root bootstrap distinguishes normal pages from fragment and query bridge callbacks", () => {
    for (const suffix of ["", "?ear=true", "#section", "?code=not-a-callback", "?state=not-a-callback"])
        assert.equal(isAuthenticationReturn(new URL(`https://localhost:30663/${suffix}`)), false);
    for (const suffix of ["#code=offline&state=offline", "?code=offline&state=offline", "#error=access_denied&state=offline", "?error=access_denied&state=offline"])
        assert.equal(isAuthenticationReturn(new URL(`https://localhost:30663/${suffix}`)), true);
    const settings = validateSettings(example());
    assert.match(route(settings, settings.host.origin, "/").body, /src="\/entry.mjs"/);
    assert.equal(route(settings, settings.host.origin, "/entry.mjs").status, 200);
    assert.equal(route(settings, settings.children[0].origin, "/entry.mjs").status, 404);
});
test("root callback and one inactive empty child preserve strict origin and registration validation", () => {
    const input = example();
    input.host.redirectUri = `${input.host.origin}/`;
    input.children[0] = { active: false, name: "Inactive app", clientId: "", origin: "", redirectUri: "", scopes: [] };
    const settings = validateSettings(input);
    assert.equal(settings.children.length, 2);
    assert.equal(settings.children[0].clientId, "");
    assert.equal(settings.registrationConfirmed, false);
    assert.equal(route(settings, "http://localhost:7444", "/").status, 404);
    assert.ok(!route(settings, settings.host.origin, "/").headers["content-security-policy"].includes("7444"));
    for (const mutate of [
        value => value.host.redirectUri = `${value.host.origin}/?callback=true`,
        value => value.host.redirectUri = "https://evil.example/",
        value => value.children[0].clientId = value.host.clientId,
        value => value.children[0].origin = "http://localhost:7444",
        value => value.children[0].active = "false",
        value => value.children[1].origin = "http://evil.example:7445",
        value => value.children[1].clientId = value.host.clientId,
        value => value.children[1] = structuredClone(value.children[0]),
    ]) {
        const invalid = structuredClone(input);
        mutate(invalid);
        assert.throws(() => validateSettings(invalid));
    }
});
test("TestSlice is optional, validated, and emitted only in host config", () => {
    const input = { ...example(), testSlice: "synthetic-test-slice" };
    const settings = validateSettings(input);
    assert.ok(route(settings, settings.host.origin, "/config.js").body.includes('"testSlice":"synthetic-test-slice"'));
    assert.ok(!route(settings, settings.children[0].origin, "/config.js").body.includes("testSlice"));
    delete input.testSlice;
    assert.equal(validateSettings(input).testSlice, undefined);
    for (const testSlice of ["", null, 42, "test&dc=other", "test slice", "a".repeat(129)])
        assert.throws(() => validateSettings({ ...input, testSlice }), /TestSlice/);
});
test("launch permits unconfirmed localhost UI and requires three distinct trusted origins", () => {
    assert.equal(validateSettings(example()).registrationConfirmed, false);
    assert.equal(validateSettings(confirmed()).children.length, 2);
    for (const change of [settings => settings.host.origin = "http://example.com:7443", settings => settings.children[0].origin = settings.host.origin, settings => settings.children.push(settings.children[0]), settings => settings.host.origin = "https://example.com:7443", settings => settings.children[0].redirectUri = "brk-multihub://wrong"]) {
        const settings = confirmed(); change(settings);
        assert.throws(() => validateSettings(settings));
    }
});
test("HTTP is literal localhost only, with matching scheme and exact host redirect", () => {
    const settings = example();
    assert.equal(validateSettings(settings).host.origin, "http://localhost:7443");
    for (const hostname of ["127.0.0.1", "[::1]", "localhost.", "host.bridge-poc.local", "example.com", "localhost.evil.example"]) {
        const input = structuredClone(settings);
        input.host.origin = `http://${hostname}:7443`;
        input.host.redirectUri = `${input.host.origin}/redirect.html`;
        assert.throws(() => validateSettings(input));
    }
    for (const mutate of [input => input.host.redirectUri = "https://localhost:7443/redirect.html", input => input.children[0].origin = "https://localhost:7444"]) {
        const input = structuredClone(settings); mutate(input);
        assert.throws(() => validateSettings(input));
    }
});
test("settings fallback is base-directory based and explicit missing settings fail", context => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "web-bridge-settings-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.copyFileSync(path.join(root, "test/settings.fixture.json"), path.join(directory, "settings.example.json"));
    const settings = loadSettings({}, directory);
    assert.equal(settings.host.origin, "http://localhost:7443");
    assert.equal(settings.host.redirectUri, "http://localhost:7443/redirect.html");
    assert.equal(settings.registrationConfirmed, false);
    assert.deepEqual(settings.children.map(child => child.origin), ["http://localhost:7444", "http://localhost:7445"]);
    assert.throws(() => loadSettings({ settings: path.join(directory, "missing-explicit.json") }, directory), /ENOENT/);
    const tlsSettings = loadSettings({ cert: "explicit.pem", key: "explicit-key.pem" }, directory);
    assert.equal(tlsSettings.host.origin, "https://localhost:7443");
    assert.equal(tlsSettings.host.redirectUri, "https://localhost:7443/redirect.html");
});
test("local settings override fallback and explicit settings override local without TLS rewriting", context => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "web-bridge-settings-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.copyFileSync(path.join(root, "test/settings.fixture.json"), path.join(directory, "settings.example.json"));
    const local = confirmed();
    const localPath = path.join(directory, "settings.json");
    const explicitPath = path.join(directory, "explicit.json");
    fs.writeFileSync(localPath, JSON.stringify(local));
    fs.writeFileSync(explicitPath, JSON.stringify(example()));
    assert.deepEqual(loadSettings({}, directory), validateSettings(local));
    assert.deepEqual(loadSettings({ cert: "explicit.pem", key: "explicit-key.pem" }, directory), validateSettings(local));
    assert.deepEqual(loadSettings({ settings: explicitPath, cert: "explicit.pem", key: "explicit-key.pem" }, directory), validateSettings(example()));
    assert.equal(fs.readFileSync(localPath, "utf8"), JSON.stringify(local));
    assert.equal(fs.readFileSync(explicitPath, "utf8"), JSON.stringify(example()));
});
test("explicit HTTPS arguments and missing explicit settings never start HTTP", () => {
    for (const args of [["--cert", "missing.pem"], ["--key", "missing.pem"], ["--cert", "missing.pem", "--key", "missing-key.pem"], ["--settings", "missing-explicit.json"]]) {
        const result = spawnSync(process.execPath, [path.join(root, "scripts/launch.mjs"), ...args], { cwd: path.dirname(root), encoding: "utf8", timeout: 10000 });
        assert.equal(result.status, 1);
        assert.equal(result.stdout.includes("Web host:"), false);
        assert.match(result.stderr, args[0] === "--settings" ? /settings:.*ENOENT/ : /TLS:/);
    }
});
test("missing staging source reports staging rather than required settings", context => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "web-bridge-staging-"));
    context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const settingsPath = path.join(directory, "settings.json");
    fs.copyFileSync(path.join(root, "test/settings.fixture.json"), settingsPath);
    const result = spawnSync(process.execPath, [path.join(root, "scripts/launch.mjs"), "--settings", settingsPath], {
        cwd: directory, encoding: "utf8", timeout: 10000, env: { ...process.env, THREE_P_REPO: directory },
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout.includes("Web host:"), false);
    assert.match(result.stderr, /staging:.*ENOENT/);
});
test("rejects case-variant host/child client ID duplicates", () => {
    const settings = confirmed();
    settings.children[0].clientId = settings.host.clientId.toUpperCase();
    assert.throws(() => validateSettings(settings), /identity/);
});
test("rejects case-variant sibling client ID duplicates", () => {
    const settings = confirmed();
    settings.children[1].clientId = settings.children[0].clientId.toUpperCase();
    assert.throws(() => validateSettings(settings), /identity/);
});
test("normalizes unique uppercase GUIDs in emitted config and audience validation", async () => {
    const input = confirmed();
    input.tenantId = input.tenantId.toUpperCase();
    for (const app of [input.host, ...input.children]) app.clientId = app.clientId.toUpperCase();
    const settings = validateSettings(input);
    assert.equal(settings.tenantId, example().tenantId);
    assert.equal(settings.authority, `https://login.microsoftonline.com/${example().tenantId}`);
    assert.equal(input.host.clientId, example().host.clientId.toUpperCase());
    for (const [index, app] of [settings.host, ...settings.children].entries()) {
        assert.equal(app.clientId, [example().host, ...example().children][index].clientId);
        const emitted = route(settings, app.origin, "/config.js").body;
        const config = JSON.parse(emitted.slice("window.webPocConfig=".length, -1));
        assert.equal(index === 0 ? config.host.clientId : config.child.clientId, app.clientId);
        assert.equal(index === 0 ? config.authority : config.child.authority, settings.authority);
        if (index === 0) assert.deepEqual(config.children.map(child => child.clientId), example().children.map(child => child.clientId));
    }
    const account = { homeAccountId: "test-home", environment: "login.microsoftonline.com", tenantId: settings.tenantId };
    const child = settings.children[0];
    const result = { accessToken: "test-access", idToken: "test-id", idTokenClaims: { aud: example().children[0].clientId }, account, scopes: child.scopes, expiresOn: new Date(Date.now() + 3600000), authority: settings.authority };
    const pca = { getActiveAccount: () => account, acquireTokenSilent: async request => {
        assert.equal(request.embeddedClientId, example().children[0].clientId);
        return result;
    } };
    const executor = new WebTokenExecutor(pca, { authority: settings.authority, refreshTokenAndNetwork: 4, registrationConfirmed: true });
    const request = { method: "GetToken", child, tokenParams: { scope: "User.Read" } };
    assert.equal((await executor.execute(request)).account.idTokenClaims.aud, child.clientId);
    for (const audience of [settings.host.clientId, settings.children[1].clientId]) {
        result.idTokenClaims.aud = audience;
        await assert.rejects(executor.execute(request), /invalid_token_result/);
    }
});
test("TLS never generates certificates, bypasses validation or falls back to HTTP", () => {
    assert.throws(() => tlsOptions({}), /cert.*key/i);
    assert.throws(() => tlsOptions({ cert: "missing.pem", key: "missing-key.pem" }));
});
test("HTTPS settings require TLS and explicit TLS rejects HTTP settings", async () => {
    await assert.rejects(serve(validateSettings(example()), { cert: "explicit", key: "explicit" }), /downgrade refused/);
    const settings = example();
    for (const app of [settings.host, ...settings.children]) app.origin = app.origin.replace("http:", "https:");
    settings.host.redirectUri = `${settings.host.origin}/redirect.html`;
    await assert.rejects(serve(validateSettings(settings)), /TLS cert and key/);
});
test("stages exact native child, compiled transport and actual host MSAL bytes", () => {
    stage();
    for (const name of ["index.html", "app.js", "styles.css", "msal-browser.js"]) {
        assert.deepEqual(fs.readFileSync(path.join(root, "artifacts/child", name)), fs.readFileSync(path.join(root, "../NativeBridgeTokenSample/web", name)));
    }
    assert.deepEqual(fs.readFileSync(path.join(root, "artifacts/msal-bridge.js")), fs.readFileSync(path.join(root, "../../../lib/msal-bridge/dist/msal-bridge.js")));
    const threeP = process.env.THREE_P_REPO || path.resolve(root, "../../.." );
    assert.deepEqual(fs.readFileSync(path.join(root, "artifacts/host-msal.js")), fs.readFileSync(path.join(threeP, "lib/msal-browser/lib/msal-browser.js")));
    assert.deepEqual(fs.readFileSync(path.join(root, "artifacts/redirect-bridge.mjs")), fs.readFileSync(path.join(threeP, "lib/msal-browser/lib/redirect-bridge/msal-redirect-bridge.js")));
});
test("routes restrict host/child surfaces, inject shim before application scripts and forbid unknown routes", () => {
    const settings = validateSettings(confirmed());
    const response = route(settings, settings.children[0].origin, "/");
    assert.equal(response.status, 200);
    const html = response.body.toString();
    assert.ok(html.indexOf("/child-transport.js") < html.indexOf('src="msal-browser.js"'));
    assert.ok(html.includes('/msal-bridge.js'));
    assert.ok(html.indexOf("/child-transport.js") < html.indexOf("/msal-bridge.js"));
    assert.ok(html.indexOf("/msal-bridge.js") < html.indexOf("/child-bootstrap.js"));
    assert.ok(html.indexOf("/child-bootstrap.js") < html.indexOf('src="msal-browser.js"'));
    assert.deepEqual(route(settings, settings.children[0].origin, "/msal-bridge.js").body, fs.readFileSync(path.join(root, "artifacts/msal-bridge.js")));
    assert.deepEqual(route(settings, settings.host.origin, "/host-protocol.mjs").body, fs.readFileSync(path.join(root, "web/host-protocol.mjs")));
    assert.equal(route(settings, settings.children[0].origin, "/host-protocol.mjs").status, 404);
    for (const origin of [settings.host.origin, ...settings.children.map(child => child.origin)]) {
        for (const pathname of ["/artifacts/bridge-protocol.js", "/nativeBridge.js"]) assert.equal(route(settings, origin, pathname).status, 404);
    }
    for (const url of ["/settings.json", "/../settings.json", "/executor.mjs", "/artifacts/child/app.js", "/%2e%2e/settings.json"]) assert.equal(route(settings, settings.children[0].origin, url).status, 404);
    assert.equal(route(settings, "https://evil.example", "/").status, 404);
    assert.match(response.headers["content-security-policy"], /frame-ancestors http:\/\/localhost:7443/);
    assert.match(route(settings, settings.host.origin, "/").headers["content-security-policy"], /frame-ancestors 'none'/);
    assert.equal(route(settings, settings.host.origin, "/config.js").body.toString().includes("cert"), false);
    assert.equal(route(settings, settings.host.origin, "/redirect.html?code=test-only&state=test-only").status, 200);
    for (const pathname of ["/inspect.html", "/inspect.mjs", "/popup-relay.js"]) {
        assert.equal(route(settings, settings.host.origin, pathname).status, 404);
        for (const child of settings.children) assert.equal(route(settings, child.origin, pathname).status, 404);
    }
});