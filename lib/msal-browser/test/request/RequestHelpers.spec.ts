/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    BaseAuthRequest,
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
    Logger,
    StubPerformanceClient,
} from "@azure/msal-common";
import * as RequestHelpers from "../../src/request/RequestHelpers.js";
import { BrowserConfiguration } from "../../src/config/Configuration.js";
import { SilentRequest } from "../../src/request/SilentRequest.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";
import { TokenBindingKeyManager } from "../../src/crypto/TokenBindingKeyManager.js";

describe("RequestHelpers tests", () => {
    let mockConfig: BrowserConfiguration;
    let mockPerformanceClient: any;
    let mockLogger: Logger;

    beforeEach(() => {
        mockConfig = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: "https://login.microsoftonline.com/common",
            },
        } as BrowserConfiguration;

        mockPerformanceClient = new StubPerformanceClient();

        mockLogger = new Logger({});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("initializeBaseRequest", () => {
        it("should initialize a base request with default values", async () => {
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: "test-correlation-id",
                scopes: ["User.Read"],
            };

            const result = await RequestHelpers.initializeBaseRequest(
                request,
                mockConfig,
                mockPerformanceClient,
                mockLogger,
                TEST_CONFIG.CORRELATION_ID
            );

            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.scopes).toEqual(["User.Read"]);
            expect(result.authority).toBe(
                "https://login.microsoftonline.com/common"
            );
            expect(result.authenticationScheme).toBe(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("should throw an error if SSH authentication scheme is used without sshJwk", async () => {
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: "test-correlation-id",
                authenticationScheme: Constants.AuthenticationScheme.SSH,
            };

            await expect(
                RequestHelpers.initializeBaseRequest(
                    request,
                    mockConfig,
                    mockPerformanceClient,
                    mockLogger,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).rejects.toThrowError(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshJwk,
                    ""
                )
            );
        });

        it("should throw an error if DPoP authentication scheme is missing resource method", async () => {
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: "test-correlation-id",
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            };

            await expect(
                RequestHelpers.initializeBaseRequest(
                    request,
                    mockConfig,
                    mockPerformanceClient,
                    mockLogger,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).rejects.toThrowError(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.dpopMissingResourceContext,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("should throw an error if DPoP authentication scheme is missing resource uri", async () => {
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: "test-correlation-id",
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestMethod: "GET",
            };

            await expect(
                RequestHelpers.initializeBaseRequest(
                    request,
                    mockConfig,
                    mockPerformanceClient,
                    mockLogger,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).rejects.toThrowError(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.dpopMissingResourceContext,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("should provision dpop_jkt for DPoP authentication requests", async () => {
            const provisionSpy = jest
                .spyOn(
                    TokenBindingKeyManager.prototype,
                    "provisionTokenBindingKey"
                )
                .mockResolvedValue("test-dpop-jkt");
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: "test-correlation-id",
                scopes: ["User.Read"],
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            };

            const result = await RequestHelpers.initializeBaseRequest(
                request,
                mockConfig,
                mockPerformanceClient,
                mockLogger,
                TEST_CONFIG.CORRELATION_ID
            );

            expect(result.dpopJkt).toBe("test-dpop-jkt");
            expect(provisionSpy).toHaveBeenCalledWith({
                tokenBindingKeyType: "dpop",
                tokenBindingKeyAlgorithm: "ES256",
                keyScope: `dpop.${TEST_CONFIG.MSAL_CLIENT_ID}.https://login.microsoftonline.com/common`,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            });
        });
    });

    describe("initializeSilentRequest", () => {
        it("should initialize a silent request with default values", async () => {
            const request: SilentRequest & { correlationId: string } = {
                correlationId: "test-correlation-id",
                scopes: ["User.Read"],
                forceRefresh: true,
            };

            const account = {
                homeAccountId: "test-home-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test-user",
                localAccountId: "test-local-account-id",
            };

            const result = await RequestHelpers.initializeSilentRequest(
                request,
                account,
                mockConfig,
                mockPerformanceClient,
                mockLogger
            );

            expect(result.correlationId).toBe("test-correlation-id");
            expect(result.scopes).toEqual(["User.Read"]);
            expect(result.account).toEqual(account);
            expect(result.forceRefresh).toBe(true);
        });
    });
});
