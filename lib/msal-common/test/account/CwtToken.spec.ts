import { webcrypto } from "crypto";
import * as AuthToken from "../../src/account/AuthToken";
import {
    CBOR_TAG_COSE_SIGN1,
    CBOR_TAG_CWT,
    COAP_CONTENT_FORMAT_CWT,
    COSE_ALG_ES256,
    COSE_HEADER_ALG,
    COSE_HEADER_KID,
    COSE_HEADER_TYP,
    CWT_CLAIM_AUD,
    CWT_CLAIM_AZP,
    CWT_CLAIM_AZPACR,
    CWT_CLAIM_CTI,
    CWT_CLAIM_EMAIL,
    CWT_CLAIM_EXP,
    CWT_CLAIM_EXT_MAP,
    CWT_CLAIM_IAT,
    CWT_CLAIM_ISS,
    CWT_CLAIM_NAME,
    CWT_CLAIM_NBF,
    CWT_CLAIM_NONCE,
    CWT_CLAIM_OID,
    CWT_CLAIM_PREFERRED_USERNAME,
    CWT_CLAIM_SCOPE,
    CWT_CLAIM_SIGNIN_STATE,
    CWT_CLAIM_SUB,
    CWT_CLAIM_TID,
    CWT_CLAIM_VER,
    CborValue,
    base64UrlToBytes,
    buildCoseSigStructure,
    bytesToBase64Url,
    decodeCwtToken,
    encodeDeterministicCbor,
    formatUuidBytes,
    isCwtToken,
    parseUuidToBytes,
    verifyCwtEs256Signature,
} from "../../src/account/CwtToken";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError";
import { mockCrypto } from "../client/ClientTestUtils.js";

const subtle = (globalThis.crypto?.subtle ??
    (webcrypto as unknown as Crypto).subtle) as SubtleCrypto;

if (!globalThis.crypto) {
    Object.defineProperty(globalThis, "crypto", {
        value: webcrypto,
        configurable: true,
    });
}

async function createSignedTestCwt(
    claimsEntries: Array<[number | string, CborValue]>
): Promise<{
    token: string;
    jwk: Record<string, unknown>;
    privateKey: CryptoKey;
}> {
    const keyPair = await subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
    );
    const exportedJwk = (await subtle.exportKey(
        "jwk",
        keyPair.publicKey
    )) as Record<string, unknown>;

    const kidBytes = new Uint8Array([
        0x33, 0x04, 0xb1, 0x26, 0x7b, 0xef, 0x05, 0x58, 0xe2, 0x27, 0xd1, 0xf3,
        0x64, 0x82, 0xa4, 0x0c, 0x22, 0x37, 0x53, 0xd0,
    ]);
    const kid = bytesToBase64Url(kidBytes);

    const protMap = new Map<number | string, CborValue>([
        [COSE_HEADER_ALG, COSE_ALG_ES256],
        [COSE_HEADER_KID, kidBytes],
        [COSE_HEADER_TYP, COAP_CONTENT_FORMAT_CWT],
    ]);
    const protectedBytes = encodeDeterministicCbor(protMap);

    const payloadMap = new Map<number | string, CborValue>(claimsEntries);
    const payloadBytes = encodeDeterministicCbor(payloadMap);

    const sigStructure = buildCoseSigStructure(protectedBytes, payloadBytes);
    const sigBuffer = await subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        keyPair.privateKey,
        new Uint8Array(sigStructure)
    );
    const sigBytes = new Uint8Array(sigBuffer);

    const taggedCwt = encodeDeterministicCbor({
        tag: CBOR_TAG_CWT,
        value: {
            tag: CBOR_TAG_COSE_SIGN1,
            value: [
                protectedBytes,
                new Map<number | string, CborValue>(),
                payloadBytes,
                sigBytes,
            ],
        },
    });

    return {
        token: bytesToBase64Url(taggedCwt),
        jwk: {
            ...exportedJwk,
            kid,
            use: "sig",
            alg: "ES256",
        },
        privateKey: keyPair.privateKey,
    };
}

describe("CwtToken and AuthToken CWT integration", () => {
    it("encodes exact deterministic RFC 8949 protected header bytes and UUID bytes", () => {
        const uuid = "4c8e2a91-6f54-4d38-9b72-e5a10f4c83d2";
        const uuidBytes = parseUuidToBytes(uuid);
        expect(Array.from(uuidBytes)).toEqual([
            0x4c, 0x8e, 0x2a, 0x91, 0x6f, 0x54, 0x4d, 0x38, 0x9b, 0x72, 0xe5,
            0xa1, 0x0f, 0x4c, 0x83, 0xd2,
        ]);
        expect(formatUuidBytes(uuidBytes)).toBe(uuid);

        const kidBytes = base64UrlToBytes("MwSxJnvvBVjiJ9HzZIKkDCI3U9A");
        const protBytes = encodeDeterministicCbor(
            new Map<number | string, CborValue>([
                [COSE_HEADER_TYP, COAP_CONTENT_FORMAT_CWT],
                [COSE_HEADER_KID, kidBytes],
                [COSE_HEADER_ALG, COSE_ALG_ES256],
            ])
        );
        const hex = Array.from(protBytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        expect(hex).toBe(
            "a3012604543304b1267bef0558e227d1f36482a40c223753d010183d"
        );
    });

    it("extracts OIDC ID token and V2 access token claims via AuthToken.extractTokenClaims and verifies ES256 signature", async () => {
        const appGuid = "5d9f3b82-7e65-4e49-8c83-f6b21a5d94e3";
        const tenantGuid = "42937a3c-3b01-4e71-b3ed-719ff0499ae3";
        const oidGuid = "a1b2c3d4-e5f6-4789-abcd-0123456789ab";

        const extClaims = new Map<number | string, CborValue>([
            ["custom_claim", "custom_val"],
        ]);

        const { token, jwk } = await createSignedTestCwt([
            [CWT_CLAIM_ISS, "https://login.live-tst.com:44329"],
            [CWT_CLAIM_SUB, "PAIRWISE_SUB_1234567890"],
            [CWT_CLAIM_AUD, parseUuidToBytes(appGuid)],
            [CWT_CLAIM_EXP, 1794871929],
            [CWT_CLAIM_NBF, 1794785229],
            [CWT_CLAIM_IAT, 1794785229],
            [CWT_CLAIM_CTI, new Uint8Array(16).fill(0x11)],
            [CWT_CLAIM_SCOPE, "access_as_user"],
            [CWT_CLAIM_VER, "2.0"],
            [CWT_CLAIM_AZP, parseUuidToBytes(appGuid)],
            [CWT_CLAIM_AZPACR, 0],
            [CWT_CLAIM_OID, parseUuidToBytes(oidGuid)],
            [CWT_CLAIM_TID, parseUuidToBytes(tenantGuid)],
            [CWT_CLAIM_NAME, "Jane Doe"],
            [CWT_CLAIM_PREFERRED_USERNAME, "janedoe@test.com"],
            [CWT_CLAIM_EMAIL, "janedoe@test.com"],
            [CWT_CLAIM_NONCE, "expected-oidc-nonce"],
            [CWT_CLAIM_SIGNIN_STATE, ["kmsi"]],
            [CWT_CLAIM_EXT_MAP, extClaims],
        ]);

        const syntheticJwt = [
            Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url"),
            Buffer.from(JSON.stringify({ sub: "1" })).toString("base64url"),
            "unsigned",
        ].join(".");
        expect(token.startsWith("2D3S")).toBe(true);
        expect(isCwtToken(token)).toBe(true);
        expect(isCwtToken(syntheticJwt)).toBe(false);

        const extracted = AuthToken.extractTokenClaims(
            token,
            mockCrypto.base64Decode,
            "corr-1"
        );
        expect(extracted.iss).toBe("https://login.live-tst.com:44329");
        expect(extracted.sub).toBe("PAIRWISE_SUB_1234567890");
        expect(extracted.aud).toBe(appGuid);
        expect(extracted.azp).toBe(appGuid);
        expect(extracted.azpacr).toBe("0");
        expect(extracted.oid).toBe(oidGuid);
        expect(extracted.tid).toBe(tenantGuid);
        expect(extracted.scp).toBe("access_as_user");
        expect(extracted.ver).toBe("2.0");
        expect(extracted.name).toBe("Jane Doe");
        expect(extracted.preferred_username).toBe("janedoe@test.com");
        expect(extracted.email).toBe("janedoe@test.com");
        expect(extracted.nonce).toBe("expected-oidc-nonce");
        expect(AuthToken.isKmsi(extracted)).toBe(true);
        expect((extracted as Record<string, unknown>).custom_claim).toBe(
            "custom_val"
        );

        const verified = await verifyCwtEs256Signature(
            token,
            { keys: [jwk] },
            "corr-verify"
        );
        expect(verified.header.alg).toBe("ES256");
        expect(verified.header.typ).toBe(COAP_CONTENT_FORMAT_CWT);
        expect(verified.claims.aud).toBe(appGuid);

        // Tamper with last byte of signature -> verifyCwtEs256Signature must reject
        const raw = base64UrlToBytes(token);
        raw[raw.length - 1] ^= 0x01;
        const tamperedToken = bytesToBase64Url(raw);

        await expect(
            verifyCwtEs256Signature(tamperedToken, { keys: [jwk] }, "corr-bad")
        ).rejects.toBeInstanceOf(ClientAuthError);
    });

    it("throws tokenParsingError with correlationId on corrupted CWT bytes", () => {
        const badCwt = bytesToBase64Url(
            new Uint8Array([0xd8, 0x3d, 0xd2, 0x84, 0xff])
        );
        expect(isCwtToken(badCwt)).toBe(true);
        try {
            decodeCwtToken(badCwt, "corr-corrupt");
            throw new Error("Expected decodeCwtToken to throw");
        } catch (err) {
            expect(err).toBeInstanceOf(ClientAuthError);
            expect((err as ClientAuthError).errorCode).toBe(
                ClientAuthErrorCodes.tokenParsingError
            );
            expect((err as ClientAuthError).correlationId).toBe("corr-corrupt");
        }
    });
});
