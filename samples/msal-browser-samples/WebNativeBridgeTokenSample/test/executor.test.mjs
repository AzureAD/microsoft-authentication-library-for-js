import test from "node:test";
import assert from "node:assert/strict";
import { WebTokenExecutor } from "../web/executor.mjs";

const account = { homeAccountId: "home.tenant", environment: "login.microsoftonline.com", tenantId: "tenant" };
const child = { clientId: "33333333-3333-4333-8333-333333333333", redirectUri: "brk-multihub://localhost:7444", scopes: ["User.Read"] };
const authority = "https://login.microsoftonline.com/22222222-2222-4222-8222-222222222222";
function setup(overrides = {}) {
    const calls = [];
    const result = { accessToken: "child-access", idToken: "child-id", idTokenClaims: { aud: child.clientId }, account, scopes: ["User.Read"], expiresOn: new Date(Date.now() + 3600000), authority, ...overrides };
    const pca = { getActiveAccount: () => account, acquireTokenSilent: async request => { calls.push(["silent", request]); return result; }, acquireTokenPopup: async request => { calls.push(["popup", request]); return result; } };
    return { executor: new WebTokenExecutor(pca, { authority, refreshTokenAndNetwork: 4, registrationConfirmed: true }), calls, result, pca };
}
const request = { method: "GetToken", child, tokenParams: { scope: "User.Read", correlationId: "95aee5a4-f926-4891-abcd-927c14bb1090" } };
test("host TestSlice is forwarded for silent and popup requests and cannot be overridden by children", async () => {
    const { pca, calls } = setup();
    const executor = new WebTokenExecutor(pca, { authority, refreshTokenAndNetwork: 4, registrationConfirmed: true, testSlice: "synthetic-test-slice" });
    for (const method of ["GetToken", "GetTokenPopup"]) {
        await executor.execute({ ...request, method, tokenParams: { ...request.tokenParams, extraQueryParameters: { dc: "untrusted" } } });
        assert.deepEqual(calls.at(-1)[1].extraQueryParameters, { dc: "synthetic-test-slice" });
    }
});
test("unconfirmed registration blocks both authentication methods before any PCA call", async () => {
    for (const registrationConfirmed of [false, undefined]) {
        const pca = new Proxy({}, { get() { assert.fail("Unconfirmed executor must not access PCA"); } });
        const executor = new WebTokenExecutor(pca, { authority, refreshTokenAndNetwork: 4, registrationConfirmed });
        for (const method of ["GetToken", "GetTokenPopup"]) await assert.rejects(executor.execute({ ...request, method }), /^Error: registration_not_confirmed$/);
    }
});
test("silent uses actual broker fields, bypasses host AT cache and disables child persistence", async () => {
    const { executor, calls } = setup();
    const response = await executor.execute(request, { signal: new AbortController().signal });
    assert.equal(calls[0][0], "silent");
    assert.deepEqual(calls[0][1], { scopes: ["User.Read"], authority, embeddedClientId: child.clientId, redirectUri: child.redirectUri, correlationId: request.tokenParams.correlationId, account, cacheLookupPolicy: 4, storeInCache: { accessToken: false, idToken: false }, skipBrokerClaims: true });
    assert.equal(response.token.access_token, "child-access");
    assert.equal(response.account.idTokenClaims.aud, child.clientId);
});
test("only GetTokenPopup invokes interactive API", async () => {
    const { executor, calls } = setup();
    await executor.execute({ ...request, method: "GetTokenPopup" }, {});
    assert.equal(calls[0][0], "popup");
});
test("Graph-qualified and short scopes are equivalent without changing returned scopes", async () => {
    const qualified = "https://graph.microsoft.com/User.Read";
    const response = await setup({ scopes: [qualified] }).executor.execute(request, {});
    assert.equal(response.token.scope, qualified);
    const configured = { ...child, scopes: [qualified] };
    await setup().executor.execute({ ...request, child: configured, tokenParams: { ...request.tokenParams, scope: qualified } }, {});
});
test("returned permissions may be a superset of requested scopes", async () => {
    const scopes = ["Mail.Read", "User.Read", "profile", "openid", "email"];
    const response = await setup({ scopes }).executor.execute(request);
    assert.equal(response.token.scope, scopes.join(" "));
});
test("other resources or permissions do not satisfy a requested Graph scope", async () => {
    for (const scope of ["https://evil.example/User.Read", "https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com.evil.example/User.Read"]) {
        await assert.rejects(setup({ scopes: [scope] }).executor.execute(request, {}), { message: "invalid_token_result" });
    }
});
test("every requested scope must be present in valid returned scope metadata", async () => {
    for (const scopes of [undefined, null, [], "User.Read", ["User.Read", null], ["User.Read", ""], ["User.Read", "Mail.Read email"]]) {
        await assert.rejects(setup({ scopes }).executor.execute(request), { message: "invalid_token_result" });
    }
    await assert.rejects(setup().executor.execute({ ...request, tokenParams: { ...request.tokenParams, scope: "User.Read Mail.Read" } }), { message: "invalid_token_result" });
    await setup({ scopes: ["User.Read"] }).executor.execute({ ...request, child: { ...child, scopes: ["User.Read", "Mail.Read"] } });
});
for (const [name, overrides] of Object.entries({ hostAudience: { idTokenClaims: { aud: "host" } }, noId: { idToken: "" }, expired: { expiresOn: new Date(0) }, noAccess: { accessToken: "" }, wrongAccount: { account: { ...account, homeAccountId: "other" } }, wrongEnvironment: { account: { ...account, environment: "other" } }, wrongAuthority: { authority: "https://evil.example" }, scopeEscalation: { scopes: ["Mail.Read"] } })) {
    test(`rejects ${name} without returning tokens`, async () => {
        await assert.rejects(setup(overrides).executor.execute(request, {}), { message: "invalid_token_result" });
    });
}
test("missing host account stays silent and requires interaction", async () => {
    const { executor, pca, calls } = setup();
    pca.getActiveAccount = () => null;
    await assert.rejects(executor.execute(request, {}), /account_unavailable/);
    assert.equal(calls.length, 0);
});
test("aborted or changed-account late SDK success is suppressed", async () => {
    for (const reset of ["abort", "account"]) {
        const { executor, pca, result } = setup();
        let finish;
        pca.acquireTokenSilent = () => new Promise(resolve => { finish = resolve; });
        const controller = new AbortController();
        const pending = executor.execute(request, { signal: controller.signal });
        if (reset === "abort") controller.abort(); else pca.getActiveAccount = () => ({ ...account, homeAccountId: "changed" });
        finish(result);
        await assert.rejects(pending, /cancelled|account_changed/);
    }
});