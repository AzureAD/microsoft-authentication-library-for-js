import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { root, stage } from "../scripts/stage.mjs";
import path from "node:path";

test("compiled bridge installs a custom frame transport and forwards NAA unchanged", () => {
    stage();
    const handlers = new Map();
    const sent = [];
    const parent = { postMessage: (data, origin) => sent.push({ data, origin }) };
    const hostOrigin = "https://localhost:30663";
    const sandbox = {
        webPocConfig: { hostOrigin, child: { name: "App 2", clientId: "child", authority: "authority", scopes: ["User.Read"] } },
        parent, crypto, setTimeout, clearTimeout,
        location: { reload() { throw new Error("unexpected reload"); } },
        addEventListener: (name, listener) => handlers.set(name, listener),
        removeEventListener: (name, listener) => { if (handlers.get(name) === listener) handlers.delete(name); },
    };
    sandbox.window = sandbox;
    const context = vm.createContext(sandbox);
    for (const file of ["web/child-transport.js", "artifacts/msal-bridge.js", "web/child-bootstrap.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
    const bridge = sandbox.nestedAppAuthBridge;
    try {
        assert.equal(bridge.host, "webview2");
        assert.equal(bridge.transport, sandbox.webPocTransport);
        const raw = ' { "messageType": "NestedAppAuthRequest", "requestId": "raw-1", "method": "GetToken", "tokenParams": { "clientId": "child", "scope": "User.Read" } } ';
        bridge.postMessage(raw);
        assert.equal(sent.length, 0);
        const receive = data => handlers.get("message")({ source: parent, origin: hostOrigin, data: { channel: "web-native", ...data } });
        receive({ kind: "challenge", epoch: "epoch" });
        const nonce = sent[0].data.nonce;
        receive({ kind: "attached", epoch: "epoch", nonce });
        assert.equal(sent[1].data.payload, raw);
        assert.equal(sent[1].origin, hostOrigin);
        const received = [];
        bridge.addEventListener("message", event => received.push(event.data));
        const payload = { messageType: "NestedAppAuthResponse", requestId: "raw-1", success: true, token: { access_token: "synthetic" } };
        for (const forged of [{ origin: "https://evil.example" }, { source: {} }, { data: { channel: "web-native", kind: "response", epoch: "wrong", nonce, payload } }]) {
            handlers.get("message")({ source: parent, origin: hostOrigin, data: { channel: "web-native", kind: "response", epoch: "epoch", nonce, payload }, ...forged });
        }
        assert.equal(received.length, 0);
        receive({ kind: "response", epoch: "epoch", nonce, payload });
        assert.deepEqual(received, [JSON.stringify(payload)]);
        const maximum = raw.replace("raw-1", "maximum").padEnd(1_048_576, " ");
        bridge.postMessage(maximum);
        assert.equal(sent.at(-1).data.payload, maximum);
        const sentBeforeOversize = sent.length;
        assert.throws(() => bridge.postMessage(maximum + " "));
        assert.equal(sent.length, sentBeforeOversize);
        bridge.postMessage(raw.replace("raw-1", "raw-2"));
        bridge.dispose();
        assert.equal(sent.at(-1).data.kind, "cancel");
        assert.equal(sent.at(-1).data.requestId, "raw-2");
        assert.equal(handlers.has("message"), false);
        assert.equal(handlers.has("pagehide"), false);
        assert.throws(() => bridge.postMessage(raw), /disposed/);
    } finally { bridge.dispose(); }
});