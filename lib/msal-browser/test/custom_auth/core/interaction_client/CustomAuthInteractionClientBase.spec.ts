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
    let client: SignInClient;
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

        authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockBrowserConfiguration,
            StubbedNetworkModule,
            mockCacheManager,
            mockLogger,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        client = new SignInClient(
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
        jest.clearAllMocks();
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
