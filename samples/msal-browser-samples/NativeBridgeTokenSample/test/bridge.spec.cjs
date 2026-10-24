const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const script = fs.readFileSync(path.join(__dirname, "../../../../lib/msal-bridge/dist/msal-bridge.js"), "utf8");

function setup() {
    const handlers = new Set(), sent = [];
    const window = { chrome: { webview: {
        postMessage: message => sent.push(message),
        addEventListener: (_, handler) => handlers.add(handler),
        removeEventListener: (_, handler) => handlers.delete(handler),
    } } };
    window.window = window;
    vm.runInContext(script, vm.createContext(window));
    const bridge = window.nestedAppAuthBridge, responses = [];
    bridge.addEventListener("message", event => responses.push(JSON.parse(event.data)));
    return { window, bridge, responses, sent, handlers,
        receive: response => handlers.forEach(handler => handler({ data: JSON.stringify(response) })) };
}

for (const method of ["GetInitContext", "GetToken", "GetTokenPopup"]) {
    test(`built WebView2 bridge forwards ${method} and native response unchanged`, () => {
        const context = setup();
        assert.equal(context.bridge.host, "webview2");
        assert.equal(typeof context.window.NestedAppAuthBridge.installNestedAppAuthBridge, "function");
        const request = { messageType: "NestedAppAuthRequest", method, requestId: "TEST_ONLY_REQUEST",
            tokenParams: { clientId: "TEST_ONLY_CLIENT", scope: "User.Read", claims: "TEST_ONLY_CLAIMS" } };
        const message = JSON.stringify(request);
        context.bridge.postMessage(message);
        assert.deepEqual(context.sent, [message]);
        assert.deepEqual(context.responses, []);
        const response = { messageType: "NestedAppAuthResponse", requestId: request.requestId, success: true,
            token: { access_token: "TEST_ONLY_ACCESS", id_token: "TEST_ONLY_ID", expires_in: 3600 },
            account: { homeAccountId: "TEST_ONLY_HOME", environment: "login.microsoftonline.com" } };
        context.receive(response);
        assert.deepEqual(context.responses, [response]);
        context.bridge.dispose();
    });
}

test("native errors pass through without JS interpretation", () => {
    const context = setup();
    const response = { messageType: "NestedAppAuthResponse", requestId: "TEST_ONLY_REQUEST", success: false,
        error: { status: "USER_CANCEL", code: "oneauth_cancelled", description: "TEST_ONLY_NATIVE_DESCRIPTION" } };
    context.receive(response);
    assert.deepEqual(context.responses, [response]);
    context.bridge.dispose();
});

test("portable bridge does not own request correlation or duplicate suppression", () => {
    const context = setup();
    context.bridge.postMessage("{}");
    context.bridge.postMessage("{}");
    assert.deepEqual(context.sent, ["{}", "{}"]);
    context.receive({ requestId: "TEST_ONLY_UNSOLICITED" });
    context.receive({ requestId: "TEST_ONLY_UNSOLICITED" });
    assert.equal(context.responses.length, 2);
    context.bridge.dispose();
});

test("listener isolation, removal, and native listener disposal", () => {
    const context = setup();
    let removedDeliveries = 0;
    const removed = () => removedDeliveries++;
    context.bridge.addEventListener("message", () => { throw new Error("listener failed"); });
    context.bridge.addEventListener("message", removed);
    context.bridge.removeEventListener("message", removed);
    context.receive({ success: true });
    assert.deepEqual(context.responses, [{ success: true }]);
    assert.equal(removedDeliveries, 0);
    context.bridge.dispose();
    assert.equal(context.handlers.size, 0);
    context.receive({ success: false });
    assert.equal(context.responses.length, 1);
    assert.throws(() => context.bridge.postMessage("{}"), /disposed/);
    context.bridge.dispose();
});