/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorityFactory,
    Constants,
    Logger,
    ProtocolMode,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { buildConfiguration } from "../../src/config/Configuration.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import {
    handleResponseEAR,
    getAuthCodeRequestUrl,
    getCodeFormData,
    getEARFormData,
} from "../../src/protocol/Authorize.js";
import { initializeAuthorizationRequest } from "../../src/interaction_client/StandardInteractionClient.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import {
    ApiId,
    BrowserCacheLocation,
    InteractionType,
} from "../../src/utils/BrowserConstants.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    ID_TOKEN_CLAIMS,
    TEST_CONFIG,
    TEST_STATE_VALUES,
    TEST_TOKEN_RESPONSE,
    generateValidEarJWE,
    validEarJWK,
} from "../utils/StringConstants.js";

describe.each([
    BrowserCacheLocation.SessionStorage,
    BrowserCacheLocation.LocalStorage,
])("Capability cache EAR import in %s", (cacheLocation) => {
    afterEach(() => {
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    it.each([false, true])(
        "aligns authorize claims and decrypted EAR cache partitions with raw broker skip=%s",
        async (skipRawBrokerClaims) => {
            const brokerParameters = skipRawBrokerClaims
                ? {
                      skipBrokerClaims: true,
                      extraParameters: {
                          brk_client_id: TEST_CONFIG.MSAL_CLIENT_ID,
                          brk_redirect_uri: window.location.href,
                      },
                  }
                : {};
            const config = buildConfiguration(
                {
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        clientCapabilities: skipRawBrokerClaims ? ["CP1"] : [],
                        authority: TEST_CONFIG.validAuthority,
                        authorityMetadata: JSON.stringify(
                            DEFAULT_OPENID_CONFIG_RESPONSE.body
                        ),
                        cloudDiscoveryMetadata: JSON.stringify(
                            DEFAULT_TENANT_DISCOVERY_RESPONSE.body
                        ),
                    },
                    cache: { cacheLocation },
                    system: {
                        protocolMode: ProtocolMode.EAR,
                        allowPlatformBroker: false,
                    },
                },
                true
            );
            const logger = new Logger({});
            const performance = new StubPerformanceClient();
            const events = new EventHandler();
            const cache = new BrowserCacheManager(
                config.auth.clientId,
                config.cache,
                new CryptoOps(logger),
                logger,
                performance,
                events,
                {
                    canonicalAuthority: config.auth.authority,
                    cloudDiscoveryMetadata:
                        DEFAULT_TENANT_DISCOVERY_RESPONSE.body,
                }
            );
            await cache.initialize(TEST_CONFIG.CORRELATION_ID);
            const authority = await AuthorityFactory.createDiscoveredInstance(
                config.auth.authority,
                config.system.networkClient,
                cache,
                {
                    protocolMode: ProtocolMode.EAR,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: config.auth.cloudDiscoveryMetadata,
                    authorityMetadata: config.auth.authorityMetadata,
                },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                performance
            );
            const request = {
                ...brokerParameters,
                authority: config.auth.authority,
                scopes: ["user.read"],
                correlationId: TEST_CONFIG.CORRELATION_ID,
                redirectUri: window.location.href,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                nonce: ID_TOKEN_CLAIMS.nonce,
                responseMode: Constants.ResponseMode.FRAGMENT,
                earJwk: validEarJWK,
            };
            const cp1 = JSON.stringify({
                access_token: { xms_cc: { values: ["CP1"] } },
            });
            for (const [token, claims] of [
                ["ordinary-ear", undefined],
                ["cae-ear", cp1],
                ["recovery-ear", cp1],
            ] as const) {
                if (token === "recovery-ear") {
                    jest.spyOn(
                        FetchClient.prototype,
                        "sendPostRequestAsync"
                    ).mockResolvedValueOnce({
                        status: 400,
                        headers: {},
                        body: {
                            error: "interaction_required",
                            error_description: "Synthetic denial",
                        },
                    });
                    const failed = new PublicClientApplication(config);
                    await failed.initialize();
                    await expect(
                        failed.acquireTokenSilent({
                            account: failed.getAllAccounts()[0],
                            scopes: ["user.read"],
                            claims: JSON.stringify({
                                access_token: {
                                    xms_cc: { values: ["CP1"] },
                                    auth_time: { essential: true },
                                },
                            }),
                        })
                    ).rejects.toMatchObject({
                        errorCode: "interaction_required",
                    });
                }
                const initialized = await initializeAuthorizationRequest(
                    { ...request, claims },
                    InteractionType.Popup,
                    config,
                    new CryptoOps(logger),
                    cache,
                    logger,
                    performance,
                    TEST_CONFIG.CORRELATION_ID
                );
                const protocolRequest = {
                    ...initialized,
                    earJwk: validEarJWK,
                    codeChallenge: "A".repeat(43),
                };
                const getUrl = await getAuthCodeRequestUrl(
                    config,
                    authority,
                    protocolRequest,
                    logger,
                    performance
                );
                const codeForm = await getCodeFormData(
                    config,
                    authority,
                    protocolRequest,
                    logger,
                    performance
                );
                const earForm = await getEARFormData(
                    config,
                    authority,
                    protocolRequest,
                    logger,
                    performance
                );
                for (const outgoingClaims of [
                    new URL(getUrl).searchParams.get("claims"),
                    codeForm.fields.claims,
                    earForm.fields.claims,
                ]) {
                    expect(
                        JSON.parse(
                            outgoingClaims!
                        ).access_token?.xms_cc?.values?.includes("CP1") || false
                    ).toBe(!!claims);
                }
                const jwe = await generateValidEarJWE(
                    JSON.stringify({
                        ...TEST_TOKEN_RESPONSE.body,
                        scope: "user.read",
                        access_token: token,
                    }),
                    validEarJWK
                );
                const result = await handleResponseEAR(
                    { ...initialized, earJwk: validEarJWK },
                    { state: initialized.state, ear_jwe: jwe },
                    ApiId.acquireTokenPopup,
                    config,
                    authority,
                    cache,
                    cache,
                    events,
                    logger,
                    performance
                );
                expect(result.accessToken).toBe(token);
            }
            const reloaded = new PublicClientApplication(config);
            await reloaded.initialize();
            const account = reloaded.getAllAccounts()[0];
            expect(account).toBeDefined();
            const ordinary = await reloaded.acquireTokenSilent({
                ...brokerParameters,
                account,
                scopes: ["user.read"],
            });
            const cae = await reloaded.acquireTokenSilent({
                ...brokerParameters,
                account,
                scopes: ["user.read"],
                claims: cp1,
            });
            expect(ordinary.accessToken).toBe("ordinary-ear");
            expect(cae.accessToken).toBe("recovery-ear");
            expect(ordinary.fromCache && cae.fromCache).toBe(true);
            expect(cache.getTokenKeys(4).accessToken).toHaveLength(2);
            expect(cache.getTokenKeys(3).accessToken).toHaveLength(0);
            expect(cache.getTokenKeys(4).refreshToken).toHaveLength(1);
            expect(
                cache
                    .getTokenKeys(4)
                    .accessToken.map(
                        (key) =>
                            cache.getAccessTokenCredential(
                                key,
                                TEST_CONFIG.CORRELATION_ID
                            )?.additionalCacheKeyComponents
                    )
            ).toEqual(
                expect.arrayContaining([
                    { clientCapabilities: "false" },
                    { clientCapabilities: "true" },
                ])
            );
        }
    );
});
