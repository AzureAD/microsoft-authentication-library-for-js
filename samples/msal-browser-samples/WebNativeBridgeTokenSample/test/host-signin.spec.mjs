import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { root, stage } from "../scripts/stage.mjs";
import { route as sampleRoute, validateSettings } from "../scripts/server.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BRIDGE_PLAYWRIGHT || path.resolve(root, "../../../node_modules/playwright"));

test("real MSAL normal popup handles root callback success and server errors without logging tokens", { timeout: 45000 }, async () => {
    stage();
    const settings = validateSettings({ ...JSON.parse(fs.readFileSync(path.join(root, "settings.example.json"))), registrationConfirmed: true });
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    try {
        const context = await browser.newContext();
        const messages = [], errors = [], unexpected = [];
        let failure;
        let nonce;
        let authorizations = 0;
        let exchanges = 0;
        const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
        context.on("page", page => {
            page.on("console", message => messages.push(message.text()));
            page.on("pageerror", error => errors.push(error.name));
        });
        await context.route("**/*", async route => {
            const url = new URL(route.request().url());
            if (url.hostname === "login.microsoftonline.com") {
                if (url.pathname.endsWith("/authorize")) {
                    authorizations++;
                    assert.equal(url.searchParams.get("client_id"), settings.host.clientId);
                    assert.equal(url.searchParams.get("redirect_uri"), `${settings.host.origin}/`);
                    assert.equal(url.searchParams.get("dc"), settings.testSlice ?? null);
                    nonce = url.searchParams.get("nonce");
                    const response = new URL(settings.host.redirectUri);
                    response.hash = new URLSearchParams(failure
                        ? { ...failure, error_description: "offline-private-description", state: url.searchParams.get("state") }
                        : { code: "offline-test-code", state: url.searchParams.get("state") }).toString();
                    return route.fulfill({ contentType: "text/html", body: `<script>location.replace(${JSON.stringify(response.href)})</script>` });
                }
                if (url.pathname.endsWith("/token")) {
                    exchanges++;
                    const now = Math.floor(Date.now() / 1000);
                    const claims = { aud: settings.host.clientId, iss: `${settings.authority}/v2.0`, tid: settings.tenantId,
                        oid: "22222222-2222-2222-2222-222222222222", sub: "offline-user", preferred_username: "offline@example.invalid", nonce, iat: now, nbf: now, exp: now + 3600 };
                    return route.fulfill({ json: { token_type: "Bearer", scope: "openid profile", expires_in: 3600,
                        access_token: "offline-access-token", refresh_token: "offline-refresh-token",
                        client_info: encode({ uid: claims.oid, utid: settings.tenantId }),
                        id_token: `${encode({ alg: "none", typ: "JWT" })}.${encode(claims)}.offline` } });
                }
                if (url.pathname.includes("openid-configuration")) return route.fulfill({ json: {
                    authorization_endpoint: `${settings.authority}/oauth2/v2.0/authorize`, token_endpoint: `${settings.authority}/oauth2/v2.0/token`,
                    end_session_endpoint: `${settings.authority}/oauth2/v2.0/logout`, issuer: `${settings.authority}/v2.0`, jwks_uri: `${settings.authority}/discovery/v2.0/keys`,
                } });
                return route.fulfill({ json: { tenant_discovery_endpoint: `${settings.authority}/v2.0/.well-known/openid-configuration`,
                    metadata: [{ preferred_network: "login.microsoftonline.com", preferred_cache: "login.windows.net", aliases: ["login.microsoftonline.com", "login.windows.net", "sts.windows.net"] }] } });
            }
            if (![settings.host.origin, ...settings.children.filter(child => child.active !== false).map(child => child.origin)].includes(url.origin)) {
                unexpected.push(url.origin);
                return route.abort();
            }
            return route.fulfill(sampleRoute(settings, url.origin, url.pathname));
        });
        const host = await context.newPage();
        await host.goto(settings.host.origin);
        await host.locator("#outcome").filter({ hasText: "Ready" }).waitFor();
        await host.locator("#signin").click();
        await host.locator("#outcome").filter({ hasText: "Host signed in" }).waitFor();
        assert.equal(await host.locator("#account").textContent(), "Host account selected");
        assert.equal(authorizations, 1);
        assert.equal(exchanges, 1);
        await host.locator("#reset").click();
        await host.locator("#outcome").filter({ hasText: "Local session reset" }).waitFor();
        for (const [response, expected] of [
            [{ error: "access_denied", suberror: "user_cancelled" }, "user_cancelled"],
            [{ error: "invalid_request", suberror: "consent_required" }, "invalid_request (consent_required)"],
        ]) {
            failure = response;
            await host.locator("#signin").click();
            await host.locator("#outcome").filter({ hasText: `Host sign-in unavailable or cancelled: ${expected}` }).waitFor();
            assert.equal(await host.locator("#account").textContent(), "Signed out");
            assert.equal(await host.locator("#signin").isEnabled(), true);
            assert.equal(await host.locator("#reset").isEnabled(), true);
        }
        assert.equal(authorizations, 3);
        assert.equal(exchanges, 1);
        assert.equal(/offline-access-token|offline-refresh-token|offline-private-description/.test(await host.locator("body").textContent()), false);
        assert.equal(messages.some(message => /offline-access-token|offline-refresh-token|offline-private-description|offline-test-code/.test(message)), false);
        assert.deepEqual(errors, []);
        assert.deepEqual(unexpected, []);
    } finally { await browser.close(); }
});