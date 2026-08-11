/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    BaseAuthRequest,
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
    JsonWebTokenAlgorithms,
    Logger,
    PopTokenGenerator,
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
                    TEST_CONFIG.CORRELATION_ID
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

        it("should throw an error with correlationId if SSH authentication scheme is used without sshKid", async () => {
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: "test-correlation-id",
                authenticationScheme: Constants.AuthenticationScheme.SSH,
                sshJwk: "test-ssh-jwk",
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
                    ClientConfigurationErrorCodes.missingSshKid,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("should throw an error if an unsupported authentication scheme is used", async () => {
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: "test-correlation-id",
                authenticationScheme: "dpop" as Constants.AuthenticationScheme,
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
                    ClientConfigurationErrorCodes.unsupportedAuthenticationScheme,
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

        it("should only validate DPoP context during base request initialization", async () => {
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

            expect(result.dpopJkt).toBeUndefined();
            expect(provisionSpy).not.toHaveBeenCalled();
        });

        it("should return dpop_jkt params when preparing a DPoP network request", async () => {
            const provisionSpy = jest
                .spyOn(
                    TokenBindingKeyManager.prototype,
                    "provisionTokenBindingKey"
                )
                .mockResolvedValue("test-dpop-jkt");
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
            };
            const tokenBindingKeyManager = new TokenBindingKeyManager(
                mockLogger,
                mockPerformanceClient
            );

            const result =
                await RequestHelpers.getTokenBindingRequestParams(
                    request,
                    tokenBindingKeyManager,
                    mockLogger,
                    mockPerformanceClient
                );

            expect(result.dpopJkt).toBe("test-dpop-jkt");
            expect(request.dpopJkt).toBeUndefined();
            expect(provisionSpy).toHaveBeenCalledWith({
                tokenBindingKeyType:
                    Constants.AuthenticationScheme.DPOP.toLowerCase(),
                tokenBindingKeyAlgorithm: JsonWebTokenAlgorithms.ES256,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            });
        });

        it("should return caller-provided dpop_jkt params without provisioning", async () => {
            const provisionSpy = jest.spyOn(
                TokenBindingKeyManager.prototype,
                "provisionTokenBindingKey"
            );
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                dpopJkt: "caller-dpop-jkt",
            };
            const tokenBindingKeyManager = new TokenBindingKeyManager(
                mockLogger,
                mockPerformanceClient
            );

            const result =
                await RequestHelpers.getTokenBindingRequestParams(
                    request,
                    tokenBindingKeyManager,
                    mockLogger,
                    mockPerformanceClient
                );

            expect(result.dpopJkt).toBe("caller-dpop-jkt");
            expect(provisionSpy).not.toHaveBeenCalled();
        });

        it("should return no DPoP token binding params for non-DPoP requests", async () => {
            const provisionSpy = jest.spyOn(
                TokenBindingKeyManager.prototype,
                "provisionTokenBindingKey"
            );
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
            } = {
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
            };
            const tokenBindingKeyManager = new TokenBindingKeyManager(
                mockLogger,
                mockPerformanceClient
            );

            const result =
                await RequestHelpers.getTokenBindingRequestParams(
                    request,
                    tokenBindingKeyManager,
                    mockLogger,
                    mockPerformanceClient
                );

            expect(result).toEqual({});
            expect(provisionSpy).not.toHaveBeenCalled();
        });

        it("should return no DPoP token binding params for platform broker requests", async () => {
            const provisionSpy = jest.spyOn(
                TokenBindingKeyManager.prototype,
                "provisionTokenBindingKey"
            );
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
                platformBroker: boolean;
            } = {
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                platformBroker: true,
            };
            const tokenBindingKeyManager = new TokenBindingKeyManager(
                mockLogger,
                mockPerformanceClient
            );

            const result =
                await RequestHelpers.getTokenBindingRequestParams(
                    request,
                    tokenBindingKeyManager,
                    mockLogger,
                    mockPerformanceClient
                );

            expect(result).toEqual({});
            expect(provisionSpy).not.toHaveBeenCalled();
        });

        it("should return generated req_cnf params for platform broker PoP requests", async () => {
            const generateCnfSpy = jest
                .spyOn(PopTokenGenerator.prototype, "generateCnf")
                .mockResolvedValue({
                    kid: "test-pop-kid",
                    reqCnfString: "test-req-cnf",
                });
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
                platformBroker: boolean;
            } = {
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: Constants.AuthenticationScheme.POP,
                platformBroker: true,
            };
            const tokenBindingKeyManager = new TokenBindingKeyManager(
                mockLogger,
                mockPerformanceClient
            );

            const result = await RequestHelpers.getTokenBindingRequestParams(
                request,
                tokenBindingKeyManager,
                mockLogger,
                mockPerformanceClient
            );

            expect(result).toEqual({ reqCnf: "test-req-cnf" });
            expect(generateCnfSpy).toHaveBeenCalledWith(request, mockLogger);
        });

        it("should encode caller-provided popKid for platform broker PoP requests", async () => {
            const generateCnfSpy = jest.spyOn(
                PopTokenGenerator.prototype,
                "generateCnf"
            );
            const request: Partial<BaseAuthRequest> & {
                correlationId: string;
                platformBroker: boolean;
            } = {
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: Constants.AuthenticationScheme.POP,
                platformBroker: true,
                popKid: "caller-pop-kid",
            };
            const tokenBindingKeyManager = new TokenBindingKeyManager(
                mockLogger,
                mockPerformanceClient
            );

            const result = await RequestHelpers.getTokenBindingRequestParams(
                request,
                tokenBindingKeyManager,
                mockLogger,
                mockPerformanceClient
            );

            expect(result.reqCnf).toBe("eyJraWQiOiJjYWxsZXItcG9wLWtpZCJ9");
            expect(generateCnfSpy).not.toHaveBeenCalled();
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

        it("should defer DPoP key provisioning for silent cache lookup", async () => {
            const provisionSpy = jest.spyOn(
                TokenBindingKeyManager.prototype,
                "provisionTokenBindingKey"
            );
            const request: SilentRequest & { correlationId: string } = {
                correlationId: "test-correlation-id",
                scopes: ["User.Read"],
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
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

            expect(result.dpopJkt).toBeUndefined();
            expect(provisionSpy).not.toHaveBeenCalled();
        });
    });
});
