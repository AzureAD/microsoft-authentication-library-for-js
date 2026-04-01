/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as child_process from "child_process";
import * as os from "os";
import { EventEmitter } from "events";
import { acquireMtlsMsiToken, clearMtlsMsiTokenCache } from "../src/MtlsMsiClient";

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

