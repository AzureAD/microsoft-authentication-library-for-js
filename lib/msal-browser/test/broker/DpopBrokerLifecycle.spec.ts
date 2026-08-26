/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    ITokenBindingKeyManager,
    Logger,
    TimeUtils,
} from "@azure/msal-common";
import {
    createDpopBrokerLifecycle,
    validateDpopBrokerOutcome,
} from "../../src/broker/nativeBroker/DpopBrokerLifecycle.js";
import {
    DPOP_BROKER_REQUEST_TOKEN_TYPE,
    PlatformAuthRequest,
} from "../../src/broker/nativeBroker/PlatformAuthRequest.js";
import { PlatformAuthResponse } from "../../src/broker/nativeBroker/PlatformAuthResponse.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";

function base64UrlEncodeBytes(bytes: Uint8Array): string {
    return window
        .btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64UrlEncodeJson(value: object): string {
    return base64UrlEncodeBytes(
        new TextEncoder().encode(JSON.stringify(value))
    );
}

describe("DpopBrokerLifecycle", () => {
    it("cryptographically verifies broker-supplied L3 proofs", async () => {
        const keyPair = await BrowserCrypto.generateKeyPair(
            true,
            ["sign", "verify"],
            BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
        );
        const publicJwk = await BrowserCrypto.exportJwk(keyPair.publicKey);
        const browserCrypto = new CryptoOps(new Logger({}));
        const proofJkt = await BrowserCrypto.computeJwkThumbprint(
            publicJwk,
            "test-correlation-id"
        );
        const createAccessToken = (jkt: string): string =>
            `${base64UrlEncodeJson({ alg: "ES256" })}.${base64UrlEncodeJson({
                cnf: { jkt },
            })}.test-signature`;
        const accessToken = createAccessToken(proofJkt);
        const encodedHeader = base64UrlEncodeJson({
            alg: "ES256",
            typ: "dpop+jwt",
            jwk: publicJwk,
        });
        const createProof = async (token: string): Promise<string> => {
            const encodedClaims = base64UrlEncodeJson({
                ath: await browserCrypto.hashString(token),
                htm: "POST",
                htu: "https://graph.microsoft.com/v1.0/me",
                iat: TimeUtils.nowSeconds(),
                jti: "test-jti",
            });
            const signingInput = `${encodedHeader}.${encodedClaims}`;
            const signature = await BrowserCrypto.sign(
                keyPair.privateKey,
                new TextEncoder().encode(signingInput),
                BrowserCrypto.ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS
            );
            return `${signingInput}.${base64UrlEncodeBytes(
                new Uint8Array(signature)
            )}`;
        };
        const proof = await createProof(accessToken);
        const lifecycle = createDpopBrokerLifecycle({
            browserCrypto,
            browserStorage: {} as BrowserCacheManager,
            correlationId: "test-correlation-id",
            logger: new Logger({}),
            performanceClient: getDefaultPerformanceClient(),
            tokenBindingKeyManager: {} as ITokenBindingKeyManager,
        });
        const request = {
            tokenType: DPOP_BROKER_REQUEST_TOKEN_TYPE,
            resourceRequestMethod: "POST",
            resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
        } as PlatformAuthRequest;

        await expect(
            validateDpopBrokerOutcome(
                lifecycle,
                {
                    access_token: accessToken,
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: proof,
                    attested_chosen: true,
                } as PlatformAuthResponse,
                request
            )
        ).resolves.toBeUndefined();

        const [encodedProofHeader, encodedProofClaims, encodedSignature] =
            proof.split(".");
        const invalidSignature = `${
            encodedSignature[0] === "A" ? "B" : "A"
        }${encodedSignature.slice(1)}`;
        await expect(
            validateDpopBrokerOutcome(
                lifecycle,
                {
                    access_token: accessToken,
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: `${encodedProofHeader}.${encodedProofClaims}.${invalidSignature}`,
                    attested_chosen: true,
                } as PlatformAuthResponse,
                request
            )
        ).rejects.toMatchObject({ errorCode: "unexpected_error" });

        const mismatchedAccessToken = createAccessToken(
            "mismatched-key-thumbprint"
        );
        await expect(
            validateDpopBrokerOutcome(
                lifecycle,
                {
                    access_token: mismatchedAccessToken,
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: await createProof(mismatchedAccessToken),
                    attested_chosen: true,
                } as PlatformAuthResponse,
                request
            )
        ).rejects.toMatchObject({ errorCode: "unexpected_error" });
    });
});
