const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { test } = require("node:test");
const { chromium } = require(process.env.BRIDGE_PLAYWRIGHT ?? path.resolve(__dirname, "../../../../node_modules/playwright"));

test("actual MSAL NAA factory, result mapping, errors, and Graph action", async () => {
    const web = path.resolve(__dirname, "../web");
    const server = http.createServer((request, response) => {
        const filename = request.url === "/" ? "index.html" : request.url.slice(1);
        if (!["index.html", "app.js", "styles.css", "msal-browser.js"].includes(filename)) { response.writeHead(404).end(); return; }
        response.setHeader("Content-Type", filename.endsWith("js") ? "application/javascript" : filename.endsWith("css") ? "text/css" : "text/html");
        response.end(fs.readFileSync(path.join(web, filename)));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    let browser;
    try {
        browser = await chromium.launch({ channel: "msedge", headless: true });
        const page = await browser.newPage();
        const pageErrors = [];
        const consoleMessages = [];
        const unexpectedRequests = [];
        const graphRequests = [];
        const graphStartStatuses = [];
        const graphProfile = { "@odata.context": "TEST_ONLY_METADATA", id: "TEST_ONLY_GRAPH_ID_".repeat(100), displayName: '<img src="invalid" onerror="window.graphHtmlExecuted=true">&TEST_ONLY_NAME', mail: "synthetic@example.test", userPrincipalName: "fallback@example.test", jobTitle: "Synthetic engineer" };
        const assertResponseCleared = async () => {
            assert.equal(await page.locator("#graph-response-region").isVisible(), false);
            assert.equal(await page.locator("#graph-response").textContent(), "");
            for (const field of ["name", "email", "job-title"]) assert.equal(await page.locator(`#profile-${field}`).textContent(), "");
            assert.equal(await page.locator("#graph-raw").evaluate(details => details.open), false);
        };
        const assertResponseShown = async () => {
            assert.equal(await page.getByRole("region", { name: "Graph Response", exact: true }).isVisible(), true);
            assert.equal(await page.locator("#profile-name").textContent(), graphProfile.displayName ?? "Not provided");
            assert.equal(await page.locator("#profile-email").textContent(), graphProfile.mail ?? graphProfile.userPrincipalName ?? "Not provided");
            assert.equal(await page.locator("#profile-job-title").textContent(), graphProfile.jobTitle ?? "Not provided");
            assert.equal(await page.locator("#profile-name > *, #profile-email > *, #profile-job-title > *").count(), 0);
            assert.equal(await page.locator("#graph-raw").evaluate(details => details.open), false);
            assert.equal(await page.locator("#graph-response").textContent(), JSON.stringify(graphProfile, null, 2));
            assert.equal(await page.locator("#graph-response > *").count(), 0);
            assert.equal(await page.evaluate(() => window.graphHtmlExecuted), undefined);
        };
        let graphFailure = false;
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("console", (message) => consoleMessages.push(
            Promise.all(message.args().map((argument) => argument.jsonValue()))
                .then((values) => JSON.stringify({ text: message.text(), values }))
        ));
        const transport = fs.readFileSync(path.resolve(__dirname, "../../../../lib/msal-bridge/dist/msal-bridge.js"), "utf8");
        await page.addInitScript({ content: `
            window.bridgePocConfig = { appName: "Nested App 2", clientId: "11111111-1111-1111-1111-111111111111", authority: "https://login.microsoftonline.com/organizations", scopes: ["User.Read"] };
            window.testMethods = [];
            window.testTokens = [];
            window.testNativeMessages = [];
            window.testAcquireResponseStates = [];
            const handlers = new Set();
            window.chrome.webview = {
                addEventListener: (_, handler) => handlers.add(handler),
                removeEventListener: (_, handler) => handlers.delete(handler),
                postMessage(message) {
                    window.testNativeMessages.push(message);
                    const request = JSON.parse(message);
                    if (request.messageType === "BridgePocReady") return;
                    if (request.messageType !== "NestedAppAuthRequest") throw new Error("Native transport only accepts NAA");
                    if (request.method === "GetInitContext") {
                        const response = { messageType: "NestedAppAuthResponse", requestId: request.requestId, success: true,
                            initContext: { sdkName: "ExplicitlyFakeTestExecutor", sdkVersion: "1.0.0", capabilities: { queryAccount: false } } };
                        queueMicrotask(() => handlers.forEach(handler => handler({ data: JSON.stringify(response) })));
                        return;
                    }
                    window.testMethods.push(request.method);
                    window.testAcquireResponseStates.push({
                        hidden: document.getElementById("graph-response-region").hidden,
                        text: document.getElementById("graph-response").textContent
                    });
                    const response = { messageType: "NestedAppAuthResponse", requestId: request.requestId, success: true };
                    if (window.testSilentError) {
                        response.success = false;
                        response.error = { status: "USER_INTERACTION_REQUIRED", code: "interaction_required", description: "Test interaction required" };
                    } else {
                        const claims = { oid: "22222222-2222-2222-2222-222222222222", tid: "33333333-3333-3333-3333-333333333333", aud: window.bridgePocConfig.clientId, exp: Math.floor(Date.now()/1000)+3600, iat: Math.floor(Date.now()/1000), sub: "test-user-" + window.testTokens.length };
                        const token = { access_token: "EXPLICITLY-FAKE-TEST-TOKEN-" + window.testTokens.length, id_token: "eyJhbGciOiJub25lIn0." + btoa(JSON.stringify(claims)).replaceAll("=", "") + ".test", expires_in: 3600 };
                        window.testTokens.push(token);
                        response.token = { ...token, scope: request.tokenParams.scope, authority: window.bridgePocConfig.authority };
                        response.account = { environment: "login.microsoftonline.com", homeAccountId: "test-home" };
                    }
                    queueMicrotask(() => handlers.forEach(handler => handler({ data: JSON.stringify(response) })));
                }
            };
            ${transport}
            window.testNaaMessages = [];
            const originalPostMessage = window.nestedAppAuthBridge.postMessage;
            window.nestedAppAuthBridge.postMessage = function (...args) {
                window.testNaaMessages.push(args[0]);
                return Reflect.apply(originalPostMessage, this, args);
            };
        ` });
        await page.route("**/*", async (route) => {
            const request = route.request();
            const url = new URL(request.url());
            if (url.origin === `http://127.0.0.1:${server.address().port}`) return route.continue();
            if (url.origin !== "https://graph.microsoft.com") {
                unexpectedRequests.push(request.url());
                return route.abort();
            }
            graphRequests.push({ url: request.url(), authorization: request.headers().authorization });
            graphStartStatuses.push(await page.locator("#graph-result").textContent());
            await assertResponseCleared();
            if (graphFailure === "http") return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(graphProfile) });
            if (graphFailure === "json") return route.fulfill({ contentType: "application/json", body: "invalid JSON" });
            if (graphFailure === "missing-id") return route.fulfill({ contentType: "application/json", body: "{}" });
            if (graphFailure) return route.abort("failed");
            return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(graphProfile) });
        });
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(() => document.getElementById("status").textContent === "Native Bridge Connected", { timeout: 10000 });
        assert.equal(await page.locator("h1").textContent(), "Nested App 2");
        assert.match(await page.locator("header").textContent(), /MSAL.js/);
        assert.equal(await page.locator("#result").isVisible(), false);
        assert.equal(await page.locator("#bridge-request").textContent(), "");
        const assertBridgeRequest = async method => {
            const raw = await page.locator("#bridge-request").textContent();
            assert.equal(raw, await page.evaluate(() => window.testNaaMessages.at(-1)));
            const request = JSON.parse(raw);
            assert.equal(request.method, method);
            assert.equal(request.messageType, "NestedAppAuthRequest");
            const native = await page.evaluate(() => window.testNativeMessages.map(message => JSON.parse(message)).filter(message => message.messageType === "NestedAppAuthRequest" && message.method !== "GetInitContext").at(-1));
            assert.equal(native.requestId, request.requestId);
            assert.equal(native.method, method);
            assert.deepEqual(native.tokenParams, request.tokenParams);
            assert.equal(await page.getByRole("region", { name: "Embedded app NAA request", exact: true }).isVisible(), true);
            const response = JSON.parse(await page.locator("#bridge-response").textContent());
            assert.equal(response.requestId, request.requestId);
            assert.equal(await page.locator("#bridge-response-region").isVisible(), true);
        };
        await assertResponseCleared();
        await page.getByRole("button", { name: "Sign In / Get Token", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("outcome").textContent === "Token received through the native bridge.");
        assert.match(await page.locator("#token").textContent(), /Received/);
        await assertBridgeRequest("GetTokenPopup");
        const fullResponse = await page.locator("#bridge-response").textContent();
        const syntheticTokens = await page.evaluate(() => window.testTokens.at(-1));
        assert.ok(fullResponse.includes(syntheticTokens.access_token));
        assert.ok(fullResponse.includes(syntheticTokens.id_token));
        assert.equal(await page.locator("#bridge-response > *").count(), 0);
        assert.doesNotMatch(await page.locator("#events").textContent(), /EXPLICITLY-FAKE-TEST-TOKEN|test-user/);
        await page.getByRole("button", { name: "Call Graph /me", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("graph-result").textContent === "HTTP 200");
        await assertResponseShown();
        await page.getByText("Raw JSON", { exact: true }).click();
        assert.equal(await page.locator("#graph-response").isVisible(), true);
        fs.mkdirSync(path.resolve(__dirname, "../artifacts"), { recursive: true });
        for (const viewport of [{ width: 1100, height: 700 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(viewport);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.equal(await page.locator("#graph-response").evaluate(response => response.clientHeight <= 300), true);
            assert.equal(await page.locator("#bridge-request").evaluate(request => request.clientHeight <= 300), true);
            await page.screenshot({ path: path.resolve(__dirname, `../artifacts/browser-graph-${viewport.width}.png`), fullPage: true });
        }
        const fullProfile = { ...graphProfile };
        for (const fallback of [
            { displayName: null, mail: null, jobTitle: null },
            { displayName: undefined, mail: undefined, userPrincipalName: undefined, jobTitle: undefined },
        ]) {
            Object.assign(graphProfile, fallback);
            await page.getByRole("button", { name: "Call Graph /me", exact: true }).click();
            await page.waitForFunction(() => !document.getElementById("graph").disabled);
            await assertResponseShown();
        }
        Object.assign(graphProfile, fullProfile);
        await page.getByRole("button", { name: "Sign In / Get Token", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("outcome").textContent === "Token received through the native bridge.");
        assert.equal(await page.locator("#graph-result").textContent(), "Not called");
        await assertResponseCleared();
        await page.getByRole("button", { name: "Call Graph /me", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("graph-result").textContent === "HTTP 200");
        await assertResponseShown();
        graphFailure = true;
        await page.getByRole("button", { name: "Call Graph /me", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("outcome").textContent.startsWith("Graph verification failed."));
        assert.equal(await page.locator("#graph-result").textContent(), "Not called");
        await assertResponseCleared();
        for (const failure of ["http", "json", "missing-id"]) {
            graphFailure = failure;
            await page.getByRole("button", { name: "Call Graph /me", exact: true }).click();
            await page.waitForFunction(() => !document.getElementById("graph").disabled);
            assert.match(await page.locator("#outcome").textContent(), /^Graph verification failed\./);
            await assertResponseCleared();
        }
        graphFailure = false;
        await page.getByRole("button", { name: "Call Graph /me", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("graph-result").textContent === "HTTP 200");
        await assertResponseShown();
        await page.getByRole("button", { name: "Clear Response", exact: true }).focus();
        await page.keyboard.press("Enter");
        await assertResponseCleared();
        assert.equal(await page.locator("#graph-result").textContent(), "HTTP 200");
        assert.equal(await page.locator("#graph").evaluate(button => button === document.activeElement), true);
        await page.getByRole("button", { name: "Call Graph /me", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("graph-result").textContent === "HTTP 200");
        await assertResponseShown();
        await page.evaluate(() => { window.testSilentError = true; });
        await page.getByRole("button", { name: "Get Token Silently", exact: true }).click();
        await page.waitForFunction(() => document.getElementById("outcome").textContent.includes("interaction_required"));
        await assertBridgeRequest("GetToken");
        await page.getByRole("button", { name: "Clear Request / Response", exact: true }).click();
        assert.equal(await page.locator("#bridge-request").textContent(), "");
        assert.equal(await page.locator("#bridge-response").textContent(), "");
        assert.equal(await page.locator("#bridge-response-region").isVisible(), false);
        assert.equal(await page.locator("#bridge-request-region").isVisible(), false);
        assert.equal(await page.locator("#graph-result").textContent(), "Not called");
        await assertResponseCleared();
        assert.equal(await page.locator("#graph").isDisabled(), true);
        assert.equal(await page.locator("#result").isVisible(), false);
        assert.equal(await page.locator("#token").textContent(), "Not acquired");
        assert.deepEqual(await page.evaluate(() => window.testMethods), ["GetTokenPopup", "GetTokenPopup", "GetToken"]);
        assert.deepEqual(await page.evaluate(() => window.testAcquireResponseStates), Array.from({ length: 3 }, () => ({ hidden: true, text: "" })));
        assert.deepEqual(graphRequests, [0, 0, 0, 1, 1, 1, 1, 1, 1, 1].map((tokenIndex) => ({
            url: "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle",
            authorization: `Bearer EXPLICITLY-FAKE-TEST-TOKEN-${tokenIndex}`,
        })));
        assert.deepEqual(graphStartStatuses, Array(graphRequests.length).fill("Not called"));
        assert.deepEqual(unexpectedRequests, []);
        fs.mkdirSync(path.resolve(__dirname, "../artifacts"), { recursive: true });
        for (const viewport of [{ width: 1100, height: 700 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(viewport);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.screenshot({ path: path.resolve(__dirname, `../artifacts/browser-${viewport.width}.png`), fullPage: true });
        }
        const tokens = await page.evaluate(() => window.testTokens);
        assert.equal(tokens.length, 2);
        const eventLog = await page.locator("#events").textContent();
        const consoleLog = (await Promise.all(consoleMessages)).join("\n");
        const nativeMessages = await page.evaluate(() => window.testNativeMessages.join("\n"));
        const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
        for (const output of [eventLog, consoleLog, nativeMessages, storage]) {
            assert.equal(output.includes("TEST_ONLY_GRAPH_ID_"), false, "Graph personal data must stay in the response region only");
            for (const value of [fullProfile.displayName, fullProfile.mail, fullProfile.userPrincipalName, fullProfile.jobTitle]) assert.equal(output.includes(value), false);
        }
        for (const token of tokens) {
            for (const secret of [token.access_token, token.id_token]) {
                assert.equal(eventLog.includes(secret), false, "event log must not contain a complete token");
                assert.equal(consoleLog.includes(secret), false, "console must not contain a complete token");
            }
        }
        assert.deepEqual(pageErrors, []);
    } finally {
        if (browser) await browser.close();
        await new Promise((resolve) => server.close(resolve));
    }
});