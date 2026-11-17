/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInClient } from "../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { buildConfiguration } from "../../../../src/config/Configuration.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultLogger,
    getDefaultNavigationClient,
    getDefaultPerformanceClient,
} from "../../test_resources/TestModules.js";
import { BrowserCacheManager } from "../../../../src/cache/BrowserCacheManager.js";
import { SignInTokenResponse } from "../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiResponseTypes.js";
import {
    TestAccountDetails,
    TestServerTokenResponse,
} from "../../test_resources/TestConstants.js";
import { DefaultScopes } from "../../../../src/custom_auth/CustomAuthConstants.js";
import { isNativeAuthSession } from "../../../../src/custom_auth/core/utils/NativeAuthSession.js";

class TestSignInClient extends SignInClient {
    processTokenResponse(response: SignInTokenResponse) {
        return this.handleTokenResponse(
            response,
            [...DefaultScopes],
            "test-correlation-id",
            0
        );
    }
}

jest.mock(
    "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    () => {
        const signInApiClient = {
            initiate: jest.fn(),
            requestChallenge: jest.fn(),
            requestTokensWithPassword: jest.fn(),
            requestTokensWithOob: jest.fn(),
            requestTokenWithContinuationToken: jest.fn(),
        };
        const signUpApiClient = {
            start: jest.fn(),
            requestChallenge: jest.fn(),
            continueWithCode: jest.fn(),
            continueWithPassword: jest.fn(),
            continueWithAttributes: jest.fn(),
        };
        const resetPasswordApiClient = {
            start: jest.fn(),
            requestChallenge: jest.fn(),
            continueWithCode: jest.fn(),
            submitNewPassword: jest.fn(),
            pollCompletion: jest.fn(),
        };

        const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
            signInApi: signInApiClient,
            signUpApi: signUpApiClient,
            resetPasswordApi: resetPasswordApiClient,
        }));

        const mockedApiClient = new CustomAuthApiClient();
        return {
            mockedApiClient,
            signInApiClient,
            signUpApiClient,
            resetPasswordApiClient,
        };
    }
);

describe("CustomAuthInteractionClientBase", () => {
    let client: TestSignInClient;
    let cacheManager: BrowserCacheManager;
    let authority: CustomAuthAuthority;
    const { mockedApiClient } = jest.requireMock(
        "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js"
    );

    beforeEach(() => {
        const clientId = customAuthConfig.auth.clientId;
        const mockBrowserConfiguration = buildConfiguration(
            { auth: { clientId: clientId } },
            false
        );
        const mockLogger = getDefaultLogger();
        const mockPerformanceClient = getDefaultPerformanceClient(clientId);
        const mockEventHandler = getDefaultEventHandler();
        const mockCrypto = getDefaultCrypto(
            clientId,
            mockLogger,
            mockPerformanceClient
        );
        const mockCacheManager = getDefaultBrowserCacheManager(
            clientId,
            mockLogger,
            mockPerformanceClient,
            mockEventHandler,
            undefined,
            mockBrowserConfiguration.cache
        );
        cacheManager = mockCacheManager;

        authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockBrowserConfiguration,
            StubbedNetworkModule,
            mockCacheManager,
            mockLogger,
            mockPerformanceClient,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        client = new TestSignInClient(
            mockBrowserConfiguration,
            mockCacheManager,
            mockCrypto,
            mockLogger,
            mockEventHandler,
            getDefaultNavigationClient(),
            mockPerformanceClient,
            mockedApiClient,
            authority
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        cacheManager.clear("test-correlation-id");
    });

    describe("V1 native session", () => {
        const tokenResponse: SignInTokenResponse = {
            ...TestServerTokenResponse,
            token_type: "Bearer",
        };

        it("sets the marker after successfully caching native tokens", async () => {
            const result = await client.processTokenResponse(tokenResponse);

            expect(result.account).not.toBeNull();
            expect(cacheManager.getTokenKeys().refreshToken).toHaveLength(1);
            expect(isNativeAuthSession(cacheManager, result.account!)).toBe(
                true
            );
        });

        it("does not set the marker if token caching fails", async () => {
            const cacheError = new Error("Cache write failed");
            jest.spyOn(cacheManager, "saveCacheRecord").mockRejectedValueOnce(
                cacheError
            );

            await expect(
                client.processTokenResponse(tokenResponse)
            ).rejects.toThrow(cacheError);

            expect(isNativeAuthSession(cacheManager, TestAccountDetails)).toBe(
                false
            );
        });
    });

    describe("getChallengeTypes", () => {
        it("should add redirect challenge type when not present", () => {
            const result = (client as any).getChallengeTypes([
                "password",
                "oob",
            ]);
            expect(result).toBe("password oob redirect");
        });

        it("should not duplicate redirect challenge type when already present", () => {
            const result = (client as any).getChallengeTypes([
                "password",
                "redirect",
                "oob",
            ]);
            expect(result).toBe("password redirect oob");
        });

        it("should handle case insensitive redirect challenge type", () => {
            const result = (client as any).getChallengeTypes([
                "password",
                "REDIRECT",
                "oob",
            ]);
            expect(result).toBe("password REDIRECT oob");
        });

        it("should add redirect when no challenge types provided", () => {
            const result = (client as any).getChallengeTypes(undefined);
            expect(result).toBe("redirect");
        });

        it("should add redirect to empty array", () => {
            const result = (client as any).getChallengeTypes([]);
            expect(result).toBe("redirect");
        });
    });
});
