/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import { BaseManagedIdentitySource } from "../../../src/client/ManagedIdentitySources/BaseManagedIdentitySource.js";
import {
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
} from "../../../src/utils/Constants.js";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../../src/error/ManagedIdentityError.js";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient.js";
import {
    systemAssignedConfig,
    managedIdentityRequestParams,
} from "../../test_kit/ManagedIdentityTestUtils.js";

/*
 * Regression coverage for the Managed Identity endpoint-redirect vulnerability:
 * the endpoint URL is read from process.env and used with credential material, so
 * its host must be pinned to a node-local (loopback / link-local) address. Otherwise
 * an in-process attacker can redirect the credential request (and its secret) to an
 * attacker-controlled server.
 */

const logger = new Logger({});

// Invoke the shared validator and return the thrown error (or undefined if it did not throw).
const validate = (
    envVar: keyof typeof ManagedIdentityErrorCodes.MsiEnvironmentVariableUrlMalformedErrorCodes,
    value: string
): unknown => {
    try {
        BaseManagedIdentitySource.getValidatedEnvVariableUrlString(
            envVar,
            value,
            ManagedIdentitySourceNames.APP_SERVICE,
            logger
        );
        return undefined;
    } catch (e) {
        return e;
    }
};

describe("Managed Identity endpoint host validation", () => {
    describe("rejects endpoints whose host is not loopback or link-local", () => {
        const disallowed: Array<[string, string]> = [
            ["off-box https host", "https://attacker.contoso.com/metadata"],
            ["off-box http host", "http://evil.example.com"],
            // userinfo confusion: the real host is evil.com, not 127.0.0.1
            ["userinfo confusion", "http://127.0.0.1@evil.com/"],
            // suffix trick: a domain that merely starts with the IMDS IP
            ["link-local suffix trick", "http://169.254.169.254.evil.com/"],
            ["private non-loopback host", "http://10.0.0.5/"],
            ["wildcard address", "http://0.0.0.0/"],
        ];

        test.each(disallowed)("%s", (_name, value) => {
            expect(
                validate(
                    ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT,
                    value
                )
            ).toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityEndpoint,
                    ""
                )
            );
        });
    });

    describe("rejects malformed (unparseable) endpoint URLs", () => {
        const malformed: Array<[string, string]> = [
            ["non-URL string", "fake_IDENTITY_ENDPOINT"],
            ["empty string", ""],
        ];

        test.each(malformed)("%s", (_name, value) => {
            expect(
                validate(
                    ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT,
                    value
                )
            ).toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes
                        .MsiEnvironmentVariableUrlMalformedErrorCodes[
                        ManagedIdentityEnvironmentVariableNames
                            .IDENTITY_ENDPOINT
                    ],
                    ""
                )
            );
        });
    });

    describe("accepts loopback and link-local endpoints", () => {
        const allowed: Array<[string, string]> = [
            [
                "IPv4 loopback (Azure Arc)",
                "http://127.0.0.1:40342/metadata/identity/oauth2/token",
            ],
            [
                "localhost (Cloud Shell)",
                "http://localhost:50342/metadata/identity/oauth2/token",
            ],
            [
                "https localhost (Service Fabric)",
                "https://localhost:2377/metadata/identity/oauth2/token",
            ],
            [
                "IPv4 link-local (IMDS)",
                "http://169.254.169.254/metadata/identity/oauth2/token",
            ],
            [
                "IPv6 loopback",
                "http://[::1]:40342/metadata/identity/oauth2/token",
            ],
            // alternate IPv4 encodings normalize to 127.0.0.1 under the WHATWG parser
            ["decimal-encoded loopback", "http://2130706433/token"],
        ];

        test.each(allowed)("%s", (_name, value) => {
            expect(
                validate(
                    ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT,
                    value
                )
            ).toBeUndefined();
        });
    });

    describe("a source refuses to acquire a token from a redirected endpoint", () => {
        afterEach(() => {
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.MSI_SECRET
            ];

            // reset cached static state between tests
            delete ManagedIdentityClient["identitySource"];
            delete ManagedIdentityApplication["nodeStorage"];
            jest.restoreAllMocks();
        });

        test("App Service does not send IDENTITY_HEADER to an attacker host", async () => {
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ] = "http://evil.example.com";
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER
            ] = "super-secret-header";

            const app = new ManagedIdentityApplication(systemAssignedConfig);
            await expect(
                app.acquireToken(managedIdentityRequestParams)
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityEndpoint,
                    ""
                )
            );
        });

        test("Cloud Shell does not POST to an attacker host", async () => {
            process.env[ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT] =
                "http://attacker.contoso.com/token";

            const app = new ManagedIdentityApplication(systemAssignedConfig);
            await expect(
                app.acquireToken(managedIdentityRequestParams)
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityEndpoint,
                    ""
                )
            );
        });
    });
});
