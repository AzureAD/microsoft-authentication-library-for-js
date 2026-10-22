/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "@azure/msal-common/browser";
import type { AccountInfo } from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient.js";
import { SilentIframeClient } from "../../src/interaction_client/SilentIframeClient.js";
import type { SilentRequest } from "../../src/request/SilentRequest.js";
import type { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { CacheLookupPolicy } from "../../src/utils/BrowserConstants.js";
import {
    ID_TOKEN_CLAIMS,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
} from "../utils/StringConstants.js";

const account: AccountInfo = {
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
    environment: "login.microsoftonline.com",
    tenantId: ID_TOKEN_CLAIMS.tid,
    username: "user@contoso.com",
};

const result: AuthenticationResult = {
    authority: TEST_CONFIG.validAuthority,
    uniqueId: account.localAccountId,
    tenantId: account.tenantId,
    scopes: ["User.Read"],
    idToken: TEST_TOKENS.IDTOKEN_V2,
    idTokenClaims: ID_TOKEN_CLAIMS,
    accessToken: TEST_TOKENS.ACCESS_TOKEN,
    fromCache: true,
    correlationId: "operation",
    expiresOn: new Date(Date.now() + 3600000),
    account,
    tokenType: Constants.AuthenticationScheme.BEARER,
};

describe.each([false, true])(
    "web silent request coalescing (reverse order: %s)",
    (reverse) => {
        let application: PublicClientApplication;

        beforeEach(async () => {
            application = new PublicClientApplication({
                auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID },
                system: { allowPlatformBroker: false },
            });
            await application.initialize();
        });

        afterEach(() => {
            jest.restoreAllMocks();
            sessionStorage.clear();
            localStorage.clear();
        });

        it.each([
            ["force refresh", {}, { forceRefresh: true }, false],
            [
                "cache lookup policy",
                {},
                { cacheLookupPolicy: CacheLookupPolicy.AccessToken },
                false,
            ],
            [
                "skip cache",
                {},
                { cacheLookupPolicy: CacheLookupPolicy.Skip },
                false,
            ],
            [
                "extra parameters",
                {},
                { extraParameters: { custom: "value" } },
                false,
            ],
            [
                "extra query parameters",
                {},
                { extraQueryParameters: { custom: "value" } },
                false,
            ],
            [
                "extra parameter values",
                { extraParameters: { custom: "first" } },
                { extraParameters: { custom: "second" } },
                false,
            ],
            [
                "extra query parameter values",
                { extraQueryParameters: { custom: "first" } },
                { extraQueryParameters: { custom: "second" } },
                false,
            ],
            [
                "identical forced refreshes",
                { forceRefresh: true },
                { forceRefresh: true },
                true,
            ],
            [
                "default options",
                {},
                {
                    forceRefresh: false,
                    cacheLookupPolicy: CacheLookupPolicy.Default,
                    extraParameters: {},
                    extraQueryParameters: {},
                },
                true,
            ],
            [
                "parameter insertion order",
                {
                    extraParameters: { z: "last", a: "first" },
                    extraQueryParameters: { z: "last", a: "first" },
                },
                {
                    extraParameters: { a: "first", z: "last" },
                    extraQueryParameters: { a: "first", z: "last" },
                },
                true,
            ],
        ] satisfies Array<[string, Partial<SilentRequest>, Partial<SilentRequest>, boolean]>)(
            "applies request identity for %s",
            async (_name, optionsA, optionsB, equivalent) => {
                let release!: () => void;
                const pending = new Promise<void>((resolve) => {
                    release = resolve;
                });
                let signalStarted!: () => void;
                const started = new Promise<void>((resolve) => {
                    signalStarted = resolve;
                });
                const acquireResult = async (
                    request: Pick<SilentRequest, "correlationId">
                ): Promise<AuthenticationResult> => {
                    signalStarted();
                    await pending;
                    return {
                        ...result,
                        accessToken: `token-${request.correlationId}`,
                    };
                };
                const acquire = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockImplementation(acquireResult);
                const iframe = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockImplementation(acquireResult);
                const options = reverse
                    ? [optionsB, optionsA]
                    : [optionsA, optionsB];
                const request: SilentRequest = {
                    scopes: ["User.Read"],
                    account,
                    correlationId: "first",
                    ...options[0],
                };
                const first = application.acquireTokenSilent(request);
                await started;
                const second = application.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account,
                    ...options[1],
                    correlationId: "second",
                });
                release();
                const results = await Promise.all([first, second]);

                const acquisitionCount = () =>
                    acquire.mock.calls.length + iframe.mock.calls.length;
                expect(acquisitionCount()).toBe(equivalent ? 1 : 2);
                expect(results.map((value) => value.accessToken)).toEqual([
                    "token-first",
                    equivalent ? "token-first" : "token-second",
                ]);
                expect(results.map((value) => value.correlationId)).toEqual([
                    "first",
                    "second",
                ]);

                await application.acquireTokenSilent(request);
                expect(acquisitionCount()).toBe(equivalent ? 2 : 3);
            }
        );
    }
);
