/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createStandardPublicClientApplication,
    PublicClientApplication,
} from "../../src/app/PublicClientApplication.js";
import {
    IDpopNonceProvider,
    isDpopNonceProvider,
} from "../../src/app/IDpopNonceProvider.js";
import { stubbedPublicClientApplication } from "../../src/app/IPublicClientApplication.js";
import * as BrowserPerformanceEvents from "../../src/telemetry/BrowserPerformanceEvents.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";
import {
    AccessTokenEntity,
    Authority,
    BaseAuthRequest,
    CacheRecord,
    Constants,
    ICrypto,
    IDpopNonceStore,
    ITokenBindingKeyManager,
    ResponseHandler,
    StubPerformanceClient,
} from "@azure/msal-common/browser";

function getDpopNonceStore(pca: unknown): IDpopNonceStore {
    return (
        pca as unknown as {
            controller: {
                dpopNonceStore: IDpopNonceStore;
            };
        }
    ).controller.dpopNonceStore;
}

async function generateResourceProof(
    dpopNonceStore: IDpopNonceStore,
    resourceRequestUri: string
): Promise<{
    proof: string | undefined;
    signTokenBindingJwt: jest.Mock;
}> {
    const signTokenBindingJwt = jest
        .fn()
        .mockResolvedValue("generated-resource-proof");
    const crypto = {
        createNewGuid: jest.fn().mockReturnValue("proof-jti"),
        hashString: jest.fn().mockResolvedValue("access-token-hash"),
        signTokenBindingJwt,
    } as unknown as ICrypto;
    const tokenBindingKeyManager = {
        getTokenBindingPublicKeyJwk: jest.fn().mockResolvedValue({
            kty: "EC",
            crv: "P-256",
            x: "public-key-x",
            y: "public-key-y",
        }),
    } as unknown as ITokenBindingKeyManager;
    const accessToken: AccessTokenEntity = {
        homeAccountId: "home-account-id",
        environment: "login.microsoftonline.com",
        credentialType: Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        secret: "access-token",
        realm: "tenant-id",
        target: "User.Read",
        cachedAt: "1",
        expiresOn: "9999999999",
        tokenType: Constants.AuthenticationScheme.DPOP,
        keyId: "dpop-key-id",
        lastUpdatedAt: "1",
    };
    const request: BaseAuthRequest = {
        authority: "https://login.microsoftonline.com/common",
        correlationId: TEST_CONFIG.CORRELATION_ID,
        scopes: ["User.Read"],
        authenticationScheme: Constants.AuthenticationScheme.DPOP,
        dpopJkt: "dpop-key-id",
        resourceRequestMethod: "GET",
        resourceRequestUri,
    };

    const result = await ResponseHandler.generateAuthenticationResult(
        crypto,
        {
            canonicalAuthority: "https://login.microsoftonline.com/common/",
        } as Authority,
        { accessToken } as CacheRecord,
        true,
        request,
        new StubPerformanceClient(),
        {
            tokenBindingKeyManager,
            dpopNonceStore,
        }
    );

    return {
        proof: result.dpopProof,
        signTokenBindingJwt,
    };
}

describe("IDpopNonceProvider", () => {
    it("is exposed by standard PCA instances without changing IPublicClientApplication", async () => {
        const pca: IDpopNonceProvider =
            await createStandardPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

        expect(pca).toBeInstanceOf(PublicClientApplication);
        expect(isDpopNonceProvider(pca)).toBe(true);
        expect(isDpopNonceProvider(stubbedPublicClientApplication)).toBe(false);
    });

    it("is not advertised by a PCA wrapping a nestable/custom controller", () => {
        const nestablePca = new PublicClientApplication(
            {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            },
            stubbedPublicClientApplication
        );

        expect(isDpopNonceProvider(nestablePca)).toBe(false);
    });

    it("delegates nonce loading and emits the public API performance event", async () => {
        const performanceClient = new BrowserPerformanceClient({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        const pca = await createStandardPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
            telemetry: {
                client: performanceClient,
            },
        });
        const events: string[] = [];
        pca.addPerformanceCallback((performanceEvents) => {
            events.push(...performanceEvents.map((event) => event.name));
        });

        await pca.loadDpopNonce(
            "https://api.contoso.com/resource",
            "resource-nonce"
        );

        const nonceStore = getDpopNonceStore(pca);
        expect(
            nonceStore.getResourceServerNonce(
                "https://api.contoso.com/another-resource"
            )
        ).toEqual({
            nonce: "resource-nonce",
            version: 1,
        });
        expect(events).toContain(
            BrowserPerformanceEvents.StandardControllerLoadDpopNonce
        );
    });

    it("uses a nonce loaded through the public PCA API in a matching resource proof", async () => {
        const pca = await createStandardPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await pca.loadDpopNonce(
            "https://api.contoso.com/challenge",
            "resource-nonce"
        );

        const { proof, signTokenBindingJwt } = await generateResourceProof(
            getDpopNonceStore(pca),
            "https://api.contoso.com/resource?query=value"
        );

        expect(proof).toBe("generated-resource-proof");
        expect(signTokenBindingJwt).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                htu: "https://api.contoso.com/resource",
                nonce: "resource-nonce",
            }),
            "dpop-key-id",
            TEST_CONFIG.CORRELATION_ID
        );
    });

    it("does not use a nonce loaded for a different resource origin", async () => {
        const pca = await createStandardPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await pca.loadDpopNonce(
            "https://api.contoso.com/challenge",
            "resource-nonce"
        );

        const { signTokenBindingJwt } = await generateResourceProof(
            getDpopNonceStore(pca),
            "https://api.fabrikam.com/resource"
        );

        expect(signTokenBindingJwt).toHaveBeenCalledWith(
            expect.anything(),
            expect.not.objectContaining({
                nonce: expect.anything(),
            }),
            "dpop-key-id",
            TEST_CONFIG.CORRELATION_ID
        );
    });
});
