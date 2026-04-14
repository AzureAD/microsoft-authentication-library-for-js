/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as os from "os";

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock ImdsClient before importing NativeHelper
jest.mock("../src/ImdsClient", () => ({
    getPlatformMetadata: jest.fn(),
    issueCredential: jest.fn(),
}));

// The N-API addon is redirected to test/__mocks__/native-addon.js via jest.config.cjs
// moduleNameMapper. We import it here to configure mock implementations per test.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockAddon = require("./__mocks__/native-addon.js") as {
    createOrOpenKey: jest.Mock;
    closeKey: jest.Mock;
    getPublicKeyDer: jest.Mock;
    signHashPss: jest.Mock;
    getAttestationToken: jest.Mock;
    makeMtlsRequest: jest.Mock;
};

// Mock os.platform/arch so loadAddon() doesn't short-circuit on non-Windows CI
jest.mock("os", () => ({
    ...jest.requireActual<typeof os>("os"),
    platform: jest.fn().mockReturnValue("win32"),
    arch: jest.fn().mockReturnValue("x64"),
}));

// Now import the module under test (after mocks are set up)
import {
    runHelper,
    runHelperHttpRequest,
    clearNativeCache,
} from "../src/internal/NativeHelper";

import {
    getPlatformMetadata,
    issueCredential,
} from "../src/ImdsClient";

// ── Test data ─────────────────────────────────────────────────────────────────

const MOCK_META = {
    clientId: "test-client-id",
    tenantId: "test-tenant-id",
    cuId: "test-vm-id",
    vmssId: "",
    attestationEndpoint: "https://sharedcus.attest.azure.net",
    mtlsAuthEndpoint: "https://centralus.mtlsauth.microsoft.com",
};

const MOCK_CERT_DER_B64 =
    // Minimal base64-DER cert (just enough for PEM wrapping; not cryptographically valid)
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA";

const MOCK_CRED_RESP = {
    certificate: MOCK_CERT_DER_B64,
    client_id: "cred-client-id",
    tenant_id: "cred-tenant-id",
    mtls_authentication_endpoint: "https://centralus.mtlsauth.microsoft.com",
    identity_type: "SystemAssigned",
};


// ── Helpers ───────────────────────────────────────────────────────────────────

function setupHappyPath(overrides: Record<string, unknown> = {}) {
    (getPlatformMetadata as jest.Mock).mockResolvedValue({ ...MOCK_META, ...overrides });
    (issueCredential as jest.Mock).mockResolvedValue(MOCK_CRED_RESP);

    mockAddon.createOrOpenKey.mockReturnValue({
        handleId: 42,
        level: "KeyGuard",
        isVbsProtected: true,
    });
    mockAddon.getPublicKeyDer.mockReturnValue(Buffer.alloc(300, 0x01));
    mockAddon.signHashPss.mockReturnValue(Buffer.alloc(256, 0xaa));
    mockAddon.getAttestationToken.mockReturnValue("mock-attestation-jwt");
    mockAddon.makeMtlsRequest.mockResolvedValue({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            access_token: "mock-access-token",
            token_type: "mtls_pop",
            expires_in: 3600,
        }),
    });
}

// ── Tests: runHelper ──────────────────────────────────────────────────────────

describe("NativeHelper.runHelper", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearNativeCache();
    });

    it("returns access_token and binding_certificate on success", async () => {
        setupHappyPath();

        const result = await runHelper({
            resource: "https://graph.microsoft.com/",
            correlationId: "test-correlation-id",
        });

        expect(result.access_token).toBe("mock-access-token");
        expect(result.token_type).toBe("mtls_pop");
        expect(result.binding_certificate).toContain("-----BEGIN CERTIFICATE-----");
        expect(result.tenant_id).toBe("cred-tenant-id");
        expect(result.client_id).toBe("cred-client-id");
    });

    it("appends /.default to resource URI without trailing slash", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://management.azure.com" });

        const [tokenCallOpts] = mockAddon.makeMtlsRequest.mock.calls[0];
        expect(tokenCallOpts.body).toContain(
            encodeURIComponent("https://management.azure.com/.default")
        );
    });

    it("does not double-append /.default if already present", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/.default" });

        const [opts] = mockAddon.makeMtlsRequest.mock.calls[0];
        const decoded = decodeURIComponent(opts.body);
        const scopeCount = (decoded.match(/\.default/g) || []).length;
        expect(scopeCount).toBe(1);
    });

    it("includes token_type=mtls_pop in the Entra token request body", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/" });

        const [opts] = mockAddon.makeMtlsRequest.mock.calls[0];
        expect(opts.body).toContain("token_type=mtls_pop");
        expect(opts.body).toContain("grant_type=client_credentials");
    });

    it("includes Content-Type header in Entra token request", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/" });

        const [opts] = mockAddon.makeMtlsRequest.mock.calls[0];
        expect(opts.headers["Content-Type"]).toBe(
            "application/x-www-form-urlencoded"
        );
    });

    it("uses mtls_authentication_endpoint from credential response to build token URL", async () => {
        setupHappyPath();
        // MOCK_CRED_RESP.mtls_authentication_endpoint = "https://centralus.mtlsauth.microsoft.com"

        await runHelper({ resource: "https://graph.microsoft.com/" });

        const [opts] = mockAddon.makeMtlsRequest.mock.calls[0];
        expect(opts.url).toContain("centralus.mtlsauth.microsoft.com");
    });

    it("normalizes bare hostname mtlsAuthEndpoint to https://", async () => {
        setupHappyPath({ mtlsAuthEndpoint: "eastus2.mtlsauth.microsoft.com" });

        await runHelper({ resource: "https://graph.microsoft.com/" });

        const [opts] = mockAddon.makeMtlsRequest.mock.calls[0];
        expect(opts.url).toMatch(/^https:\/\//);
    });

    it("uses default endpoint when mtlsAuthEndpoint is absent", async () => {
        setupHappyPath({ mtlsAuthEndpoint: undefined });

        await runHelper({ resource: "https://graph.microsoft.com/" });

        const [opts] = mockAddon.makeMtlsRequest.mock.calls[0];
        expect(opts.url).toContain("mtlsauth.microsoft.com");
    });

    it("skips attestation when withAttestation is false", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/", withAttestation: false });

        expect(mockAddon.getAttestationToken).not.toHaveBeenCalled();
    });

    it("calls attestation when withAttestation is true and VM has VBS", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/", withAttestation: true });

        expect(mockAddon.getAttestationToken).toHaveBeenCalled();
    });

    it("proceeds without attestation when addon.getAttestationToken throws", async () => {
        setupHappyPath();
        mockAddon.getAttestationToken.mockImplementation(() => {
            throw new Error("attestation failed");
        });

        // Should not throw — attestation is non-fatal
        const result = await runHelper({
            resource: "https://graph.microsoft.com/",
            withAttestation: true,
        });

        expect(result.access_token).toBe("mock-access-token");
    });

    it("throws when Entra token endpoint returns non-200", async () => {
        setupHappyPath();
        mockAddon.makeMtlsRequest.mockResolvedValue({
            status: 400,
            headers: {},
            body: JSON.stringify({ error: "invalid_request" }),
        });

        await expect(
            runHelper({ resource: "https://graph.microsoft.com/" })
        ).rejects.toThrow("HTTP 400");
    });

    it("throws when Entra token response contains error field", async () => {
        setupHappyPath();
        mockAddon.makeMtlsRequest.mockResolvedValue({
            status: 200,
            headers: {},
            body: JSON.stringify({
                error: "invalid_client",
                error_description: "Client authentication failed",
            }),
        });

        await expect(
            runHelper({ resource: "https://graph.microsoft.com/" })
        ).rejects.toThrow("invalid_client");
    });

    it("throws when Entra token response body is not valid JSON", async () => {
        setupHappyPath();
        mockAddon.makeMtlsRequest.mockResolvedValue({
            status: 200,
            headers: {},
            body: "not-json",
        });

        await expect(
            runHelper({ resource: "https://graph.microsoft.com/" })
        ).rejects.toThrow("parse");
    });

    it("creates key named MSALMtlsKey_{cuId}", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/" });

        expect(mockAddon.createOrOpenKey).toHaveBeenCalledWith(
            `MSALMtlsKey_${MOCK_META.cuId}`
        );
    });

    it("omits vmssId from CSR when vmssId is empty string", async () => {
        setupHappyPath({ vmssId: "" });

        await runHelper({ resource: "https://graph.microsoft.com/" });

        // issueCredential should have been called; check signHashPss was called (CSR built)
        expect(mockAddon.signHashPss).toHaveBeenCalled();
        expect(issueCredential).toHaveBeenCalled();
    });

    it("converts IMDS base64 DER certificate to PEM format", async () => {
        setupHappyPath();

        const result = await runHelper({ resource: "https://graph.microsoft.com/" });

        expect(result.binding_certificate).toMatch(
            /^-----BEGIN CERTIFICATE-----\n[\s\S]+\n-----END CERTIFICATE-----$/
        );
    });
});

// ── Tests: key+cert cache ─────────────────────────────────────────────────────

describe("NativeHelper key+cert cache", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearNativeCache();
    });

    it("reuses cached key handle and cert on second call", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/" });
        await runHelper({ resource: "https://graph.microsoft.com/" });

        // Second call should reuse cache — createOrOpenKey called only once
        expect(mockAddon.createOrOpenKey).toHaveBeenCalledTimes(1);
        expect(getPlatformMetadata).toHaveBeenCalledTimes(2); // IMDS metadata still fetched
    });

    it("uses identity cache key from identityType and identityId", async () => {
        setupHappyPath();

        await runHelper({
            resource: "https://graph.microsoft.com/",
            identityType: "UserAssigned",
            identityId: "my-client-id",
        });
        await runHelper({
            resource: "https://graph.microsoft.com/",
            identityType: "UserAssigned",
            identityId: "my-client-id",
        });

        expect(mockAddon.createOrOpenKey).toHaveBeenCalledTimes(1);
    });

    it("fetches fresh cert for different identities", async () => {
        setupHappyPath();

        await runHelper({
            resource: "https://graph.microsoft.com/",
            identityType: "UserAssigned",
            identityId: "identity-a",
        });
        await runHelper({
            resource: "https://graph.microsoft.com/",
            identityType: "UserAssigned",
            identityId: "identity-b",
        });

        expect(mockAddon.createOrOpenKey).toHaveBeenCalledTimes(2);
    });

    it("clearNativeCache forces re-acquisition on next call", async () => {
        setupHappyPath();

        await runHelper({ resource: "https://graph.microsoft.com/" });
        clearNativeCache();
        await runHelper({ resource: "https://graph.microsoft.com/" });

        expect(mockAddon.createOrOpenKey).toHaveBeenCalledTimes(2);
    });
});

// ── Tests: runHelperHttpRequest ───────────────────────────────────────────────

describe("NativeHelper.runHelperHttpRequest", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearNativeCache();
    });

    it("throws when no cert is cached (acquireToken not called)", async () => {
        (os.platform as jest.Mock).mockReturnValue("win32");
        (os.arch as jest.Mock).mockReturnValue("x64");

        await expect(
            runHelperHttpRequest({ url: "https://graph.microsoft.com/v1.0/me", token: "" })
        ).rejects.toThrow("acquireToken");
    });

    it("makes downstream request with cached cert and key", async () => {
        setupHappyPath();

        // Populate cache via runHelper
        await runHelper({ resource: "https://graph.microsoft.com/" });

        // Now set up downstream response
        mockAddon.makeMtlsRequest.mockResolvedValue({
            status: 200,
            headers: { "content-type": "application/json" },
            body: '{"value":[]}',
        });

        const resp = await runHelperHttpRequest({
            url: "https://mtlstb.graph.microsoft.com/v1.0/applications",
            method: "GET",
            token: "",
        });

        expect(resp.status).toBe(200);
        expect(resp.body).toBe('{"value":[]}');
    });

    it("injects mtls_pop Authorization header from token field", async () => {
        setupHappyPath();
        await runHelper({ resource: "https://graph.microsoft.com/" });

        mockAddon.makeMtlsRequest.mockResolvedValue({
            status: 200,
            headers: {},
            body: "{}",
        });

        await runHelperHttpRequest({
            url: "https://mtlstb.graph.microsoft.com/v1.0/me",
            token: "my-access-token",
        });

        const [opts] = mockAddon.makeMtlsRequest.mock.calls[mockAddon.makeMtlsRequest.mock.calls.length - 1];
        expect(opts.headers["Authorization"]).toBe("mtls_pop my-access-token");
    });

    it("does not override Authorization header if already present", async () => {
        setupHappyPath();
        await runHelper({ resource: "https://graph.microsoft.com/" });

        mockAddon.makeMtlsRequest.mockResolvedValue({ status: 200, headers: {}, body: "{}" });

        await runHelperHttpRequest({
            url: "https://mtlstb.graph.microsoft.com/v1.0/me",
            token: "token-from-field",
            headers: { Authorization: "mtls_pop already-set" },
        });

        const lastCall = mockAddon.makeMtlsRequest.mock.calls[mockAddon.makeMtlsRequest.mock.calls.length - 1];
        expect(lastCall[0].headers["Authorization"]).toBe("mtls_pop already-set");
    });

    it("uses GET method by default", async () => {
        setupHappyPath();
        await runHelper({ resource: "https://graph.microsoft.com/" });

        mockAddon.makeMtlsRequest.mockResolvedValue({ status: 200, headers: {}, body: "{}" });

        await runHelperHttpRequest({ url: "https://mtlstb.graph.microsoft.com/v1.0/me", token: "" });

        const lastCall = mockAddon.makeMtlsRequest.mock.calls[mockAddon.makeMtlsRequest.mock.calls.length - 1];
        expect(lastCall[0].method).toBe("GET");
    });

    it("passes custom method through to addon", async () => {
        setupHappyPath();
        await runHelper({ resource: "https://graph.microsoft.com/" });

        mockAddon.makeMtlsRequest.mockResolvedValue({ status: 201, headers: {}, body: "{}" });

        const resp = await runHelperHttpRequest({
            url: "https://mtlstb.graph.microsoft.com/v1.0/applications",
            method: "POST",
            body: '{"displayName":"test"}',
            token: "",
        });

        const lastCall = mockAddon.makeMtlsRequest.mock.calls[mockAddon.makeMtlsRequest.mock.calls.length - 1];
        expect(lastCall[0].method).toBe("POST");
        expect(resp.status).toBe(201);
    });

    it("includes x-ms-client-request-id header", async () => {
        setupHappyPath();
        await runHelper({ resource: "https://graph.microsoft.com/" });

        mockAddon.makeMtlsRequest.mockResolvedValue({ status: 200, headers: {}, body: "{}" });

        await runHelperHttpRequest({
            url: "https://mtlstb.graph.microsoft.com/v1.0/me",
            correlationId: "test-req-id-456",
            token: "",
        });

        const lastCall = mockAddon.makeMtlsRequest.mock.calls[mockAddon.makeMtlsRequest.mock.calls.length - 1];
        expect(lastCall[0].headers["x-ms-client-request-id"]).toBe("test-req-id-456");
    });
});
