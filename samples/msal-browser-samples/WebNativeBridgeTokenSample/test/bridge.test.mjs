import test from "node:test";
import assert from "node:assert/strict";
import { stage } from "../scripts/stage.mjs";

stage();
const { HostProjection } = await import("../web/host-projection.mjs");

const child = { clientId: "33333333-3333-4333-8333-333333333333", origin: "https://localhost:7444", scopes: ["User.Read"], authority: "https://login.microsoftonline.com/tenant" };
function setup(execute = async () => ({ token: { access_token: "secret" } }), options = {}) {
    const replies = [];
    const source = { postMessage: (data, origin) => replies.push({ data, origin }) };
    const frame = { contentWindow: source };
    const calls = [];
    const host = new HostProjection({ execute: (...args) => { calls.push(args); return execute(...args); } }, { getAccount: () => null, ...options });
    host.attach(frame, child);
    const epoch = replies.pop().data.epoch;
    const nonce = "57a96d30-043d-465c-ab58-1fe06b89078c";
    const event = data => ({ origin: child.origin, source, data: { channel: "web-native", epoch, nonce, ...data } });
    host.receive(event({ kind: "hello" }));
    replies.length = 0;
    const request = (id = "request-1", tokenParams = {}) => event({ kind: "request", payload: JSON.stringify({ messageType: "NestedAppAuthRequest", requestId: id, method: "GetToken", tokenParams: { clientId: child.clientId, scope: "User.Read", authority: child.authority, ...tokenParams } }) });
    return { host, source, frame, replies, request, calls, event };
}
test("web host owns NAA dispatch without the removed package protocol global", async () => {
    const previous = globalThis.MsalBridge;
    delete globalThis.MsalBridge;
    try {
        const state = setup();
        await state.host.receive(state.request());
        assert.equal(state.replies[0].data.payload.success, true);
        state.host.dispose();
    } finally {
        if (previous !== undefined) globalThis.MsalBridge = previous;
    }
});
test("origin and source must both match; epoch and nonce must match", async () => {
    const state = setup();
    for (const forged of [{ ...state.request(), origin: "https://evil.example" }, { ...state.request(), source: {} }, { ...state.request(), data: { ...state.request().data, nonce: "other" } }]) await state.host.receive(forged);
    assert.equal(state.calls.length, 0);
    assert.equal(state.replies.length, 0);
    await state.host.receive(state.request());
    assert.equal(state.calls.length, 1);
    assert.equal(state.replies[0].origin, child.origin);
});
test("rejects unauthorized scopes, child, authority, non-bearer and unknown fields", async () => {
    const state = setup();
    for (const [index, tokenParams] of [{ scope: "Mail.Read" }, { clientId: "sibling" }, { authority: "https://evil.example" }, { authenticationScheme: "POP" }, { sshKid: "key" }, { extraQueryParameters: {} }, { correlationId: "secret\n" }].entries()) {
        await state.host.receive(state.request(String(index), tokenParams));
        assert.equal(state.replies.at(-1).data.payload.success, false);
    }
    assert.equal(state.calls.length, 0);
});
test("inflight and completed replay IDs rejected; completed FIFO bounded to 1024", async () => {
    const state = setup();
    await state.host.receive(state.request());
    await state.host.receive(state.request());
    assert.equal(state.calls.length, 1);
    state.host.dispose();
    const unlimited = setup(undefined, { rateLimit: 2000 });
    for (let index = 0; index < 1025; index++) await unlimited.host.receive(unlimited.request(String(index)));
    await unlimited.host.receive(unlimited.request("0"));
    assert.equal(unlimited.calls.length, 1026);
});
test("timeout returns sanitized error and keeps unresolved executor occupying capacity", async () => {
    let finish;
    const state = setup(() => new Promise(resolve => { finish = resolve; }), { timeoutMs: 5, maxConcurrent: 1 });
    await state.host.receive(state.request());
    assert.equal(state.replies.at(-1).data.payload.error.code, "bridge_timeout");
    await state.host.receive(state.request("second"));
    assert.equal(state.replies.at(-1).data.payload.error.code, "bridge_busy");
    finish({ token: { access_token: "late-secret" } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(JSON.stringify(state.replies).includes("late-secret"), false);
});
test("navigation, account reset and dispose suppress late replies", async () => {
    for (const action of ["attach", "reset", "dispose"]) {
        let finish;
        const state = setup(() => new Promise(resolve => { finish = resolve; }));
        const pending = state.host.receive(state.request());
        await Promise.resolve();
        if (action === "attach") state.host.attach(state.frame, child); else state.host[action]();
        finish({ token: { access_token: "late-secret" } });
        await pending;
        assert.equal(JSON.stringify(state.replies).includes("late-secret"), false);
    }
});
test("errors contain no arbitrary SDK text or token", async () => {
    const state = setup(async () => { throw Object.assign(new Error("sensitive-access-token"), { errorCode: "interaction_required" }); });
    await state.host.receive(state.request());
    assert.equal(state.replies[0].data.payload.error.status, "USER_INTERACTION_REQUIRED");
    assert.equal(JSON.stringify(state.replies).includes("sensitive"), false);
});
test("actual NAA forceRefresh boolean is accepted without letting the child pick cache policy", async () => {
    const state = setup();
    await state.host.receive(state.request("force", { forceRefresh: true }));
    assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0][0].tokenParams.forceRefresh, undefined);
});
test("package-default message limit accepts exactly 1,048,576 characters and rejects one more", async () => {
    const state = setup();
    try {
        const maximum = state.request("maximum");
        maximum.data.payload = maximum.data.payload.padEnd(1_048_576, " ");
        await state.host.receive(maximum);
        assert.equal(state.calls.length, 1);
        assert.equal(state.replies.at(-1).data.payload.success, true);
        const oversized = state.request("oversized");
        oversized.data.payload = oversized.data.payload.padEnd(1_048_577, " ");
        await state.host.receive(oversized);
        assert.equal(state.calls.length, 1);
    } finally { state.host.dispose(); }
});
test("malformed types, prototype keys, oversize and claims escalation never reach executor", async () => {
    const state = setup();
    for (const payload of ["{", "x".repeat(1_048_577), '{"__proto__":{}}', JSON.stringify({ messageType: "NestedAppAuthRequest", method: "GetToken", requestId: "null", tokenParams: { clientId: child.clientId, scope: "User.Read", authority: 7 } })]) await state.host.receive(state.event({ kind: "request", payload }));
    for (const [index, params] of [{ extraParameters: { test: "slice" } }, { claims: '{"access_token":{"xms_cc":{"values":["cp1"]}}}' }, { platformBrokerId: "another-account" }, { authenticationScheme: "SSH" }].entries()) await state.host.receive(state.request(`bad-${index}`, params));
    assert.equal(state.calls.length, 0);
});
test("explicit cancellation returns promptly and suppresses eventual SDK success", async () => {
    let finish;
    const state = setup(() => new Promise(resolve => { finish = resolve; }));
    const pending = state.host.receive(state.request());
    await Promise.resolve();
    await state.host.receive(state.event({ kind: "cancel", requestId: "request-1" }));
    await pending;
    assert.equal(state.replies.at(-1).data.payload.error.code, "bridge_cancelled");
    finish({ token: { access_token: "late-secret" } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(JSON.stringify(state.replies).includes("late-secret"), false);
});
test("inflight replay and per-frame rate limits bound executor work", async () => {
    let finish;
    const state = setup(() => new Promise(resolve => { finish = resolve; }), { rateLimit: 3 });
    const pending = state.host.receive(state.request());
    await Promise.resolve();
    await state.host.receive(state.request());
    assert.equal(state.replies.at(-1).data.payload.error.code, "duplicate_request");
    finish({});
    await pending;
    await state.host.receive(state.event({ kind: "request", payload: JSON.stringify({ messageType: "NestedAppAuthRequest", requestId: "init-1", method: "GetInitContext" }) }));
    await state.host.receive(state.request("rate-limit"));
    assert.equal(state.replies.at(-1).data.payload.error.code, "bridge_busy");
    assert.equal(state.calls.length, 1);
});

test("host-owned init dispatch never reaches the web executor", async () => {
    const account = { homeAccountId: "home", environment: "login.microsoftonline.com", tenantId: "tenant" };
    const state = setup(undefined, { getAccount: () => account });
    await state.host.receive(state.event({ kind: "request", payload: JSON.stringify({ messageType: "NestedAppAuthRequest", requestId: "init", method: "GetInitContext" }) }));
    assert.equal(state.calls.length, 0);
    assert.equal(state.replies[0].data.payload.initContext.accountContext.homeAccountId, account.homeAccountId);
    assert.equal(state.replies[0].data.payload.messageType, "NestedAppAuthResponse");
    state.host.dispose();
});

test("global capacity survives frame-session reset until the old executor settles", async () => {
    let reject;
    const state = setup(() => new Promise((resolve, failure) => { reject = failure; }), { maxConcurrent: 1 });
    const pending = state.host.receive(state.request());
    await new Promise(resolve => setImmediate(resolve));
    state.host.attach(state.frame, child);
    const epoch = state.replies.at(-1).data.epoch;
    const next = data => ({ ...state.event(data), data: { ...state.event(data).data, epoch } });
    await state.host.receive(next({ kind: "hello" }));
    await pending;
    await state.host.receive(next({ kind: "request", payload: state.request("new-session").data.payload }));
    assert.equal(state.replies.at(-1).data.payload.error.code, "bridge_busy");
    assert.equal(state.calls.length, 1);
    reject(new Error("late-sensitive-sdk-error"));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(state.host.active, 0);
    assert.equal(JSON.stringify(state.replies).includes("late-sensitive"), false);
    state.host.dispose();
});

test("validation failure does not retire a safe ID before a corrected request", async () => {
    const state = setup();
    await state.host.receive(state.request("correctable", { scope: "Mail.Read" }));
    await state.host.receive(state.request("correctable"));
    assert.equal(state.calls.length, 1);
    assert.equal(state.replies.at(-1).data.payload.success, true);
    state.host.dispose();
});