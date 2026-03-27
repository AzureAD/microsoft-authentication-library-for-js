/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as child_process from "child_process";
import * as os from "os";
import { EventEmitter } from "events";
import { acquireMtlsMsiToken } from "../src/MtlsMsiClient";
import * as ImdsClient from "../src/ImdsClient";

jest.mock("child_process");
jest.mock("os");
jest.mock("../src/ImdsClient");

const mockMetadata: ImdsClient.PlatformMetadata = {
    clientId: "test-client-id",
    tenantId: "test-tenant-id",
    cuId: "test-cu-id",
    attestationEndpoint: "https://attest.azure.net",
    mtlsAuthEndpoint: "https://eastus.mtlsauth.microsoft.com",
};

const mockTokenResponse = {
    access_token: "test-access-token",
    token_type: "mtls_pop",
    expires_in: 3600,
    binding_certificate: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
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
    // emit stdout/stderr/close on next tick
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
        (os.platform as jest.Mock).mockReturnValue("win32");
        (os.arch as jest.Mock).mockReturnValue("x64");
        (ImdsClient.getPlatformMetadata as jest.Mock).mockResolvedValue(
            mockMetadata
        );
    });

    it("returns AuthenticationResult on success", async () => {
        (child_process.spawn as jest.Mock).mockReturnValue(
            makeProcess(0, JSON.stringify(mockTokenResponse), "")
        );

        const result = await acquireMtlsMsiToken({
            resource: "https://management.azure.com/",
        });

        expect(result.accessToken).toBe(mockTokenResponse.access_token);
        expect(result.tokenType).toBe("mtls_pop");
        expect(result.bindingCertificate).toBe(mockTokenResponse.binding_certificate);
        expect(result.tenantId).toBe(mockMetadata.tenantId);
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
