const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

function fixture(original) {
    const elements = new Map();
    const listeners = new Map();
    const document = { getElementById(name) {
        if (!elements.has(name)) elements.set(name, { textContent: "", hidden: true, addEventListener() {} });
        return elements.get(name);
    } };
    const context = vm.createContext({ document, window: { addEventListener: (name, callback) => listeners.set(name, callback) },
        console: { debug() {} }, crypto: { randomUUID: () => "test-correlation" }, performance: { now: () => 0 } });
    const source = fs.readFileSync(path.join(__dirname, "../web/app.js"), "utf8");
    vm.runInContext(source.replace(/initialize\(\);\s*$/, ""), context);
    const bridge = { postMessage: original, addEventListener: (name, callback) => listeners.set("bridge-" + name, callback) };
    context.inspectBridgeRequests(bridge);
    return { context, bridge, listeners, output: document.getElementById("bridge-request"), region: document.getElementById("bridge-request-region") };
}

const rawRequest = method => JSON.stringify({ messageType: "NestedAppAuthRequest", requestId: "test-request", method,
    tokenParams: { clientId: "child-client", claims: '<img src="invalid">', account: { username: "TEST_ONLY_PRIVATE_ACCOUNT" },
        extraParameters: { arbitrary: "TEST_ONLY_PRIVATE_PARAMETER" }, scopes: ["User.Read"] }, futureField: { preserved: true } });

test("request inspector retains exact full strings and original receiver, arguments, returns and errors", () => {
    const calls = [], result = {}, failure = new Error("original failure");
    const { bridge, output, context, region } = fixture(function (...args) {
        calls.push({ receiver: this, args });
        if (args[1] === failure) throw failure;
        return result;
    });
    const receiver = {};
    for (const method of ["GetTokenPopup", "GetToken"]) {
        const raw = "  " + rawRequest(method) + "\n";
        assert.equal(Reflect.apply(bridge.postMessage, receiver, [raw, 42]), result);
        assert.equal(calls.at(-1).receiver, receiver);
        assert.deepEqual(calls.at(-1).args, [raw, 42]);
        assert.equal(output.textContent, raw);
        assert.equal(region.hidden, false);
        assert.throws(() => bridge.postMessage(raw, failure), error => error === failure);
    }
    context.clearBridgeRequest();
    for (const message of [rawRequest("GetInitContext"), '{"messageType":"NestedAppAuthResponse","method":"GetToken","token":"TEST_ONLY_TOKEN"}', "malformed", null]) {
        assert.equal(bridge.postMessage(message), result);
        assert.equal(output.textContent, "");
    }
});

test("request inspector retains long requests, clears on pagehide, and cannot break forwarding when display fails", () => {
    let calls = 0;
    const { bridge, output, region, listeners } = fixture(() => ++calls);
    const raw = rawRequest("GetToken");
    const maximum = raw.padEnd(1_048_576, " ");
    bridge.postMessage(maximum);
    assert.equal(output.textContent, maximum);
    bridge.postMessage(maximum + " ");
    assert.equal(output.textContent, maximum + " ");
    bridge.postMessage(raw);
    listeners.get("pagehide")();
    assert.equal(output.textContent, "");
    assert.equal(region.hidden, true);
    Object.defineProperty(output, "textContent", { set() { throw new Error("display failed"); } });
    assert.equal(bridge.postMessage(raw), 4);
});

test("response inspector preserves full synthetic tokens and raw JSON without mutating delivery or logging", async () => {
    const { bridge, context, listeners } = fixture(() => {});
    const response = vm.runInContext('element("bridge-response")', context);
    const region = vm.runInContext('element("bridge-response-region")', context);
    bridge.postMessage(rawRequest("GetToken"));
    const raw = '  ' + JSON.stringify({ messageType: "NestedAppAuthResponse", requestId: "test-request",
        success: true, token: { access_token: "SYNTHETIC_ACCESS_TOKEN", id_token: "SYNTHETIC_ID_TOKEN", future: "preserved" } }) + '\n';
    const event = Object.freeze({ data: raw });
    listeners.get("bridge-message")(event);
    assert.equal(event.data, raw);
    assert.equal(response.textContent, raw);
    assert.equal(region.hidden, false);
    listeners.get("bridge-message")({ data: raw.replace("test-request", "other-request") });
    assert.equal(response.textContent, raw);
    listeners.get("pagehide")();
    assert.equal(response.textContent, "");
    listeners.get("bridge-message")(event);
    assert.equal(response.textContent, "");
    bridge.postMessage(rawRequest("GetToken"));
    listeners.get("bridge-message")(event);
    vm.runInContext('config = { scopes: ["User.Read"], authority: "https://example.test" }; application = { acquireTokenPopup() { throw new Error("before wire"); } };', context);
    await context.acquire(true);
    assert.equal(response.textContent, "");
    assert.equal(region.hidden, true);
});

test("new acquisition clears stale request even when acquisition fails before sending", async () => {
    const { bridge, output, region, context } = fixture(() => {});
    bridge.postMessage(rawRequest("GetTokenPopup"));
    vm.runInContext('config = { scopes: ["User.Read"], authority: "https://example.test" }; application = { acquireTokenPopup() { throw new Error("before wire"); } };', context);
    await context.acquire(true);
    assert.equal(output.textContent, "");
    assert.equal(region.hidden, true);
});