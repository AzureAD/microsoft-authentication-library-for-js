/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AzureCloudInstance,
    Constants,
    Logger,
    StubPerformanceClient,
    getRequestThumbprint,
} from "@azure/msal-common/browser";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { buildConfiguration } from "../../src/config/Configuration.js";
import {
    preparePlatformSilentRequest,
    prepareWebSilentRequest,
    resolveSilentRequestPreparation,
} from "../../src/request/SilentRequestHelpers.js";
import type { SilentRequestPreparationInput } from "../../src/request/SilentRequestHelpers.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";

describe("silent request preparation", () => {
    let input: SilentRequestPreparationInput;
    let logger: Logger;
    let performanceClient: StubPerformanceClient;
    let provider: PlatformAuthExtensionHandler;

    beforeEach(() => {
        logger = new Logger({});
        performanceClient = new StubPerformanceClient();
        provider = new PlatformAuthExtensionHandler(
            logger,
            2000,
            performanceClient,
            "test-extension"
        );
        input = {
            config: buildConfiguration(
                {
                    auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID },
                    system: { allowPlatformBroker: true },
                },
                true
            ),
            request: { scopes: ["User.Read"] },
            account: {
                homeAccountId: "home-account",
                localAccountId: "local-account",
                tenantId: "tenant",
                environment: "login.microsoftonline.com",
                username: "user@contoso.com",
                nativeAccountId: "native-account",
            },
            correlationId: "caller",
        };
    });

    it("preserves the original web key and request/account identities", () => {
        input.request = {
            scopes: [" Mail.Read ", "User.Read", "Mail.Read"],
            forceRefresh: true,
            extraParameters: { custom: "value" },
        };
        const prepared = prepareWebSilentRequest(input);
        const originalThumbprint = getRequestThumbprint(
            input.config.auth.clientId,
            {
                ...input.request,
                authority: input.config.auth.authority,
                correlationId: input.correlationId,
            },
            input.account.homeAccountId
        );
        expect(prepared.key).toBe(JSON.stringify(originalThumbprint));
        expect(prepared.request).toBe(input.request);
        expect(prepared.account).toBe(input.account);
        expect(input.request.account).toBeUndefined();
        expect(input.request.correlationId).toBeUndefined();
    });

    it("prepares a single consistent broker key, request snapshot, and account", () => {
        input.request = {
            scopes: [" Mail.Read ", "User.Read", "User.Read"],
            attributeTokens: ["attribute"],
            extraParameters: { custom: "original" },
            extraQueryParameters: { custom: "original" },
            azureCloudOptions: {
                azureCloudInstance: AzureCloudInstance.AzurePublic,
                tenant: "original",
            },
            storeInCache: { accessToken: false },
        };
        const prepared = preparePlatformSilentRequest(input);
        expect(prepared.key.startsWith("platform:")).toBe(true);
        const key = JSON.parse(prepared.key.slice("platform:".length));
        expect(key).toMatchObject({
            accountId: input.account.nativeAccountId,
            homeAccountIdentifier: input.account.homeAccountId,
            cloudTenantId: "original",
            extraParameters: [["custom", "original"]],
            extraQueryParameters: [["custom", "original"]],
        });
        expect(key).not.toHaveProperty("storeAccessToken");
        expect(key).not.toHaveProperty("storeIdToken");
        expect(key).not.toHaveProperty("storeRefreshToken");
        expect(key.scopes).toEqual(
            ["Mail.Read", "User.Read", ...Constants.OIDC_DEFAULT_SCOPES].sort()
        );
        expect(prepared.request).not.toBe(input.request);
        expect(prepared.account).not.toBe(input.account);
        expect(prepared.account).toBe(prepared.request.account);
        expect(prepared.request.scopes).toEqual(input.request.scopes);
        expect(prepared.request.scopes).not.toBe(input.request.scopes);

        input.account.nativeAccountId = "changed";
        input.request.scopes[0] = "changed";
        input.request.attributeTokens![0] = "changed";
        input.request.extraParameters!.custom = "changed";
        input.request.extraQueryParameters!.custom = "changed";
        input.request.azureCloudOptions!.tenant = "changed";
        input.request.storeInCache!.accessToken = true;

        expect(prepared.account.nativeAccountId).toBe("native-account");
        expect(prepared.request).toMatchObject({
            scopes: [" Mail.Read ", "User.Read", "User.Read"],
            attributeTokens: ["attribute"],
            extraParameters: { custom: "original" },
            extraQueryParameters: { custom: "original" },
            azureCloudOptions: { tenant: "original" },
            storeInCache: { accessToken: false },
        });
    });

    it.each([
        { accessToken: false },
        { idToken: false },
        { refreshToken: false },
    ])(
        "excludes storage preferences %j from broker request identity",
        (preferences) => {
            const defaultRequest = preparePlatformSilentRequest(input);
            const request = {
                ...input.request,
                storeInCache: preferences,
            };
            const prepared = preparePlatformSilentRequest({
                ...input,
                request,
            });
            expect(prepared.key).toBe(defaultRequest.key);
            expect(prepared.request.storeInCache).toEqual(preferences);
            expect(prepared.request.storeInCache).not.toBe(preferences);
        }
    );

    it("uses the resolved account rather than a different account on the input request", () => {
        input.request.account = {
            ...input.account,
            homeAccountId: "other-home",
            nativeAccountId: "other-native",
        };
        const prepared = preparePlatformSilentRequest(input);
        expect(prepared.account).toEqual(input.account);
        expect(prepared.request.account).toEqual(input.account);
        expect(prepared.key).toContain('"accountId":"native-account"');
        expect(input.request.account.nativeAccountId).toBe("other-native");
    });

    it.each([
        undefined,
        Constants.AuthenticationScheme.BEARER,
        Constants.AuthenticationScheme.POP,
    ])("selects broker preparation for supported scheme %s", (scheme) => {
        input.request.authenticationScheme = scheme;
        const prepared = resolveSilentRequestPreparation(
            input,
            provider,
            logger,
            performanceClient
        );
        expect(prepared.key.startsWith("platform:")).toBe(true);
        expect(prepared.request).not.toBe(input.request);
        expect(prepared.account).toBe(prepared.request.account);
    });

    it.each([
        Constants.AuthenticationScheme.DPOP,
        Constants.AuthenticationScheme.SSH,
    ])("keeps web preparation for unsupported broker scheme %s", (scheme) => {
        input.request.authenticationScheme = scheme;
        const prepared = resolveSilentRequestPreparation(
            input,
            provider,
            logger,
            performanceClient
        );
        expect(prepared).toEqual(prepareWebSilentRequest(input));
        expect(prepared.request).toBe(input.request);
        expect(prepared.account).toBe(input.account);
    });

    it("keeps web preparation when the application disables the broker", () => {
        input.config.system.allowPlatformBroker = false;
        const prepared = resolveSilentRequestPreparation(
            input,
            provider,
            logger,
            performanceClient
        );
        expect(prepared).toEqual(prepareWebSilentRequest(input));
        expect(prepared.request).toBe(input.request);
        expect(prepared.account).toBe(input.account);
    });

    it("keeps web preparation for accounts without a native account ID", () => {
        input.account.nativeAccountId = undefined;
        const prepared = resolveSilentRequestPreparation(
            input,
            provider,
            logger,
            performanceClient
        );
        expect(prepared).toEqual(prepareWebSilentRequest(input));
        expect(prepared.request).toBe(input.request);
        expect(prepared.account).toBe(input.account);
    });

    it("reselects preparation when broker availability changes between requests", () => {
        const broker = resolveSilentRequestPreparation(
            input,
            provider,
            logger,
            performanceClient
        );
        const web = resolveSilentRequestPreparation(
            input,
            undefined,
            logger,
            performanceClient
        );
        const reconnected = resolveSilentRequestPreparation(
            input,
            provider,
            logger,
            performanceClient
        );
        expect(broker.key.startsWith("platform:")).toBe(true);
        expect(web).toEqual(prepareWebSilentRequest(input));
        expect(web.request).toBe(input.request);
        expect(web.account).toBe(input.account);
        expect(reconnected.key).toBe(broker.key);
        expect(reconnected.request).not.toBe(broker.request);
    });
});
