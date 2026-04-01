/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as child_process from "child_process";
import * as os from "os";
import { EventEmitter } from "events";
import { acquireMtlsMsiToken, clearMtlsMsiTokenCache, makeMtlsMsiRequest } from "../src/MtlsMsiClient";

jest.mock("child_process");
jest.mock("os");

const mockTokenResponse = {
    access_token: "test-access-token",
    token_type: "mtls_pop",
    expires_in: 3600,
    binding_certificate: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
    tenant_id: "test-tenant-id",
    client_id: "test-client-id",
};

function makeProcess(
    exitCode: number,
    stdout: string,
    stderr: string
): child_process.ChildProcess {
    const proc = new EventEmitter() as child_process.ChildProcess;
    (proc as unknown as { stdout: EventEmitter; stderr: EventEmitter }).stdout =
        new EventEmitter();
    (proc as unknown as { stdout: EventEmitter; stderr: EventEmitter }).stderr =
        new EventEmitter();
    setTimeout(() => {
        (
            proc as unknown as { stdout: EventEmitter; stderr: EventEmitter }
        ).stdout.emit("data", Buffer.from(stdout));
        (
            proc as unknown as { stdout: EventEmitter; stderr: EventEmitter }
        ).stderr.emit("data", Buffer.from(stderr));
        proc.emit("close", exitCode);
    }, 0);
    return proc;
}

describe("MtlsMsiClient.acquireMtlsMsiToken", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearMtlsMsiTokenCache();
        (os.platform as jest.Mock).mockReturnValue("win32");
        (os.arch as jest.Mock).mockReturnValue("x64");
    });

    it("returns AuthenticationResult on success with fromCache: false", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        const result = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
        });

        expect(result.accessToken).toBe(mockTokenResponse.access_token);
        expect(result.tokenType).toBe("mtls_pop");
        expect(result.bindingCertificate).toBe(mockTokenResponse.binding_certificate);
        expect(result.tenantId).toBe(mockTokenResponse.tenant_id);
        expect(result.fromCache).toBe(false);
    });

    it("uses tenant_id from helper response in authority URL", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        const result = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
        });

        expect(result.authority).toBe(
            `https://login.microsoftonline.com/${mockTokenResponse.tenant_id}`
        );
    });

    it("falls back to /common authority when helper omits tenant_id", async () => {
        const responseWithoutTenantId = { ...mockTokenResponse, tenant_id: undefined };
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(responseWithoutTenantId), "")
        );

        const result = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
        });

        expect(result.authority).toBe("https://login.microsoftonline.com/common");
        expect(result.tenantId).toBe("");
    });

    it("returns cached token on second call without spawning subprocess again", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        const first = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
        });
        const second = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
        });

        expect(child_process.spawn).toHaveBeenCalledTimes(1);
        expect(first.fromCache).toBe(false);
        expect(second.fromCache).toBe(true);
        expect(second.accessToken).toBe(first.accessToken);
    });

    it("uses separate cache entries for different resources", async () => {
        (child_process.spawn as jest.Mock).mockImplementation(() =>
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        await acquireMtlsMsiToken({ resource: "https://management.azure.com/" });
        await acquireMtlsMsiToken({ resource: "https://vault.azure.net/" });

        expect(child_process.spawn).toHaveBeenCalledTimes(2);
    });

    it("bypasses cache when forceRefresh is true", async () => {
        (child_process.spawn as jest.Mock).mockImplementation(() =>
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        await acquireMtlsMsiToken({ resource: "https://management.azure.com/" });
        const result = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
            forceRefresh: true,
        });

        expect(child_process.spawn).toHaveBeenCalledTimes(2);
        expect(result.fromCache).toBe(false);
    });

    it("clearMtlsMsiTokenCache causes next call to spawn subprocess", async () => {
        (child_process.spawn as jest.Mock).mockImplementation(() =>
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        await acquireMtlsMsiToken({ resource: "https://management.azure.com/" });
        clearMtlsMsiTokenCache();
        const result = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
        });

        expect(child_process.spawn).toHaveBeenCalledTimes(2);
        expect(result.fromCache).toBe(false);
    });

    it("passes --with-attestation flag when requested", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
            withAttestation: true,
        });

        const spawnArgs = (child_process.spawn as jest.Mock).mock.calls[0][1] as string[];
        expect(spawnArgs).toContain("--with-attestation");
    });

    it("passes UserAssigned identity args", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
            identityType: "UserAssigned",
            identityId: "my-client-id",
        });

        const spawnArgs = (child_process.spawn as jest.Mock).mock.calls[0][1] as string[];
        expect(spawnArgs).toContain("--identity-type");
        expect(spawnArgs).toContain("UserAssigned");
        expect(spawnArgs).toContain("--identity-id");
        expect(spawnArgs).toContain("my-client-id");
    });

    it("rejects with parsed error when helper exits non-zero", async () => {
        const errorJson = JSON.stringify({
            error: "managed_identity_failed",
            error_description: "IMDS returned 400",
        });
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(1, "", errorJson)
        );

        await expect(
            acquireMtlsMsiToken({ resource: "https://management.azure.com/" })
        ).rejects.toThrow("IMDS returned 400");
    });

    it("rejects when not on Windows", async () => {
        (os.platform as jest.Mock).mockReturnValue("linux");

        await expect(
            acquireMtlsMsiToken({ resource: "https://management.azure.com/" })
        ).rejects.toThrow("Windows");
    });

    it("rejects on unsupported architecture", async () => {
        (os.arch as jest.Mock).mockReturnValue("ia32");

        await expect(
            acquireMtlsMsiToken({ resource: "https://management.azure.com/" })
        ).rejects.toThrow("Unsupported architecture");
    });
});

describe("MtlsMsiClient.makeMtlsMsiRequest", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (os.platform as jest.Mock).mockReturnValue("win32");
        (os.arch as jest.Mock).mockReturnValue("x64");
    });

    const mockHttpResponse = {
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "user-id", displayName: "Test User" }),
    };

    it("makes a GET request and returns status, headers, body", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockHttpResponse), "")
        );

        const result = await makeMtlsMsiRequest({
            url: "https://graph.microsoft.com/v1.0/me",
            token: "test-mtls-pop-token",
        });

        expect(result.status).toBe(200);
        expect(result.headers["content-type"]).toBe("application/json");
        expect(JSON.parse(result.body).displayName).toBe("Test User");
    });

    it("passes --mode http-request as the first args to the helper", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockHttpResponse), "")
        );

        await makeMtlsMsiRequest({
            url: "https://graph.microsoft.com/v1.0/me",
            token: "test-token",
        });

        const spawnArgs = (child_process.spawn as jest.Mock).mock.calls[0][1] as string[];
        expect(spawnArgs[0]).toBe("--mode");
        expect(spawnArgs[1]).toBe("http-request");
        expect(spawnArgs).toContain("--url");
        expect(spawnArgs).toContain("https://graph.microsoft.com/v1.0/me");
        expect(spawnArgs).toContain("--token");
        expect(spawnArgs).toContain("test-token");
    });

    it("passes --method, --body, --content-type when provided", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify({ ...mockHttpResponse, status: 201 }), "")
        );

        await makeMtlsMsiRequest({
            url: "https://graph.microsoft.com/v1.0/me/messages",
            token: "test-token",
            method: "POST",
            body: JSON.stringify({ subject: "Hello" }),
            contentType: "application/json",
        });

        const spawnArgs = (child_process.spawn as jest.Mock).mock.calls[0][1] as string[];
        expect(spawnArgs).toContain("--method");
        expect(spawnArgs).toContain("POST");
        expect(spawnArgs).toContain("--body");
        expect(spawnArgs).toContain("--content-type");
        expect(spawnArgs).toContain("application/json");
    });

    it("passes --header for each extra header", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockHttpResponse), "")
        );

        await makeMtlsMsiRequest({
            url: "https://graph.microsoft.com/v1.0/me",
            token: "test-token",
            headers: ["x-custom-header: value1", "x-other: value2"],
        });

        const spawnArgs = (child_process.spawn as jest.Mock).mock.calls[0][1] as string[];
        const headerIndices = spawnArgs.reduce<number[]>((acc, v, i) => {
            if (v === "--header") acc.push(i);
            return acc;
        }, []);
        expect(headerIndices).toHaveLength(2);
        expect(spawnArgs[headerIndices[0] + 1]).toBe("x-custom-header: value1");
        expect(spawnArgs[headerIndices[1] + 1]).toBe("x-other: value2");
    });

    it("rejects with parsed error when helper exits non-zero", async () => {
        const errorJson = JSON.stringify({
            error: "downstream_request_failed",
            error_description: "SSL handshake failed",
        });
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(1, "", errorJson)
        );

        await expect(
            makeMtlsMsiRequest({
                url: "https://graph.microsoft.com/v1.0/me",
                token: "bad-token",
            })
        ).rejects.toThrow("SSL handshake failed");
    });

    it("rejects when not on Windows", async () => {
        (os.platform as jest.Mock).mockReturnValue("linux");

        await expect(
            makeMtlsMsiRequest({
                url: "https://graph.microsoft.com/v1.0/me",
                token: "test-token",
            })
        ).rejects.toThrow("Windows");
    });
});
