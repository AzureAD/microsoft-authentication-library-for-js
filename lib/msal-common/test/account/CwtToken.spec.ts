import { webcrypto } from "crypto";
import * as AuthToken from "../../src/account/AuthToken";
import {
    CBOR_TAG_COSE_SIGN1,
    CBOR_TAG_CWT,
    COAP_CONTENT_FORMAT_CWT,
    COSE_ALG_ES256,
    COSE_HEADER_ALG,
    COSE_HEADER_CRIT,
    COSE_HEADER_KID,
    COSE_HEADER_TYP,
    CWT_CLAIM_AT_HASH,
    CWT_CLAIM_AUD,
    CWT_CLAIM_AZP,
    CWT_CLAIM_AZPACR,
    CWT_CLAIM_C_HASH,
    CWT_CLAIM_CNF,
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
    decodeCbor,
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
    claimsEntries: Array<[number | string, CborValue]>,
    options?: {
        protectedEntries?: Array<[number | string, CborValue]>;
        unprotectedEntries?: Array<[number | string, CborValue]>;
    }
): Promise<{
    token: string;
    jwk: Record<string, unknown>;
    privateKey: CryptoKey;
    kidBytes: Uint8Array;
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

    const protMap = new Map<number | string, CborValue>(
        options?.protectedEntries ?? [
            [COSE_HEADER_ALG, COSE_ALG_ES256],
            [COSE_HEADER_KID, kidBytes],
            [COSE_HEADER_TYP, COAP_CONTENT_FORMAT_CWT],
        ]
    );
    const protectedBytes = encodeDeterministicCbor(protMap);

    const unprotMap = new Map<number | string, CborValue>(
        options?.unprotectedEntries ?? []
    );

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
            value: [protectedBytes, unprotMap, payloadBytes, sigBytes],
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
        kidBytes,
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
        expect(extracted.uti).toBe(
            bytesToBase64Url(new Uint8Array(16).fill(0x11))
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

    it("base64url-encodes 16-byte hashes/opaque IDs and preserves top-level string-array claims", async () => {
        const hash16 = new Uint8Array(16).fill(0xab);
        const cnfKid16 = new Uint8Array(16).fill(0xcd);
        const expectedHashB64 = bytesToBase64Url(hash16);
        const expectedCnfKidB64 = bytesToBase64Url(cnfKid16);

        const { token } = await createSignedTestCwt([
            [CWT_CLAIM_ISS, "https://login.live-tst.com:44329"],
            [CWT_CLAIM_C_HASH, hash16],
            [CWT_CLAIM_AT_HASH, hash16],
            [
                CWT_CLAIM_CNF,
                new Map<number | string, CborValue>([
                    [COSE_HEADER_KID, cnfKid16],
                ]),
            ],
            ["emails", ["b2cuser@example.com"]],
            ["roles", ["Reader", "Writer"]],
            ["amr", ["pwd", "mfa"]],
        ]);

        const decoded = decodeCwtToken(token, "corr-hash");
        expect(decoded.claims.c_hash).toBe(expectedHashB64);
        expect(decoded.claims.at_hash).toBe(expectedHashB64);
        expect(decoded.claims.cnf?.kid).toBe(expectedCnfKidB64);
        expect(decoded.claims.emails).toEqual(["b2cuser@example.com"]);
        expect(decoded.claims.roles).toEqual(["Reader", "Writer"]);
        expect((decoded.claims as Record<string, unknown>).amr).toEqual([
            "pwd",
            "mfa",
        ]);
    });

    it("enforces RFC 9052 crit header validation and unprotected/duplicate header rules", async () => {
        const kidBytes = new Uint8Array([1, 2, 3, 4]);

        // Valid supported crit header succeeds
        const validCrit = await createSignedTestCwt(
            [[CWT_CLAIM_SUB, "sub-1"]],
            {
                protectedEntries: [
                    [COSE_HEADER_ALG, COSE_ALG_ES256],
                    [COSE_HEADER_CRIT, [COSE_HEADER_ALG, COSE_HEADER_TYP]],
                    [COSE_HEADER_KID, kidBytes],
                    [COSE_HEADER_TYP, COAP_CONTENT_FORMAT_CWT],
                ],
            }
        );
        const validVerified = await verifyCwtEs256Signature(validCrit.token, {
            keys: [{ ...validCrit.jwk, kid: bytesToBase64Url(kidBytes) }],
        });
        expect(validVerified.claims.sub).toBe("sub-1");

        // Signed CWT with unknown critical header must be rejected
        const unknownCrit = await createSignedTestCwt(
            [[CWT_CLAIM_SUB, "sub-1"]],
            {
                protectedEntries: [
                    [COSE_HEADER_ALG, COSE_ALG_ES256],
                    [COSE_HEADER_CRIT, [999]],
                    [999, "custom-critical"],
                ],
            }
        );
        await expect(
            verifyCwtEs256Signature(unknownCrit.token, {
                keys: [{ ...unknownCrit.jwk, kid: undefined }],
            })
        ).rejects.toBeInstanceOf(ClientAuthError);

        // Empty crit array must be rejected
        const emptyCrit = await createSignedTestCwt(
            [[CWT_CLAIM_SUB, "sub-1"]],
            {
                protectedEntries: [
                    [COSE_HEADER_ALG, COSE_ALG_ES256],
                    [COSE_HEADER_CRIT, []],
                ],
            }
        );
        expect(() => decodeCwtToken(emptyCrit.token)).toThrow(ClientAuthError);

        // Unprotected kid works during key rotation when matching key is not first in JWKS
        const otherPair = await subtle.generateKey(
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["sign", "verify"]
        );
        const otherJwk = (await subtle.exportKey(
            "jwk",
            otherPair.publicKey
        )) as Record<string, unknown>;

        const unprotKidToken = await createSignedTestCwt(
            [[CWT_CLAIM_SUB, "sub-unprot-kid"]],
            {
                protectedEntries: [[COSE_HEADER_ALG, COSE_ALG_ES256]],
                unprotectedEntries: [[COSE_HEADER_KID, kidBytes]],
            }
        );
        const rotatedVerified = await verifyCwtEs256Signature(
            unprotKidToken.token,
            {
                keys: [
                    { ...otherJwk, kid: "first-unrelated-key", use: "sig" },
                    {
                        ...unprotKidToken.jwk,
                        kid: bytesToBase64Url(kidBytes),
                        alg: undefined,
                    },
                ],
            }
        );
        expect(rotatedVerified.claims.sub).toBe("sub-unprot-kid");

        // Duplicate kid in both protected and unprotected headers must be rejected
        const dupKid = await createSignedTestCwt([[CWT_CLAIM_SUB, "sub-dup"]], {
            protectedEntries: [
                [COSE_HEADER_ALG, COSE_ALG_ES256],
                [COSE_HEADER_KID, kidBytes],
            ],
            unprotectedEntries: [[COSE_HEADER_KID, kidBytes]],
        });
        expect(() => decodeCwtToken(dupKid.token)).toThrow(ClientAuthError);
    });

    it("rejects JWKS keys with incompatible use, key_ops, or alg before importing", async () => {
        const { token, jwk } = await createSignedTestCwt([
            [CWT_CLAIM_SUB, "sub-jwk-filter"],
        ]);

        await expect(
            verifyCwtEs256Signature(token, {
                keys: [{ ...jwk, use: "enc" }],
            })
        ).rejects.toThrow("No matching EC P-256 signing key");

        await expect(
            verifyCwtEs256Signature(token, {
                keys: [{ ...jwk, key_ops: ["deriveKey"] }],
            })
        ).rejects.toThrow("No matching EC P-256 signing key");

        await expect(
            verifyCwtEs256Signature(token, {
                keys: [{ ...jwk, alg: "ES384" }],
            })
        ).rejects.toThrow("No matching EC P-256 signing key");

        // Accepts MSA PublishECCJWK format (use="sig", alg omitted)
        const msaStyleJwk = { ...jwk };
        delete msaStyleJwk.alg;
        const verified = await verifyCwtEs256Signature(token, {
            keys: [msaStyleJwk],
        });
        expect(verified.claims.sub).toBe("sub-jwk-filter");
    });

    it("rejects non-string nonces, reserved/colliding extension claims, duplicate CBOR map keys, and preserves leading UTF-8 BOMs", async () => {
        // 1. Non-string nonce values (number, null, bstr) must be rejected instead of dropped
        for (const badNonce of [12345, null, new Uint8Array([1, 2, 3])]) {
            const { token } = await createSignedTestCwt([
                [CWT_CLAIM_SUB, "sub-bad-nonce"],
                [CWT_CLAIM_NONCE, badNonce],
            ]);
            expect(() => decodeCwtToken(token)).toThrow(ClientAuthError);
        }

        // 2. Leading U+FEFF BOM in CBOR text strings must be preserved verbatim
        const bomNonce = "\uFEFFnonce-with-bom";
        const { token: bomToken, jwk: bomJwk } = await createSignedTestCwt([
            [CWT_CLAIM_SUB, "\uFEFFsubject"],
            [CWT_CLAIM_NONCE, bomNonce],
        ]);
        const bomVerified = await verifyCwtEs256Signature(bomToken, {
            keys: [bomJwk],
        });
        expect(bomVerified.claims.nonce).toBe(bomNonce);
        expect(bomVerified.claims.sub).toBe("\uFEFFsubject");

        // 3. Reserved claims (e.g. signin_state, tid, sub) in extension map or colliding integer+string claims must be rejected
        const { token: extSigninState } = await createSignedTestCwt([
            [CWT_CLAIM_SUB, "legit-sub"],
            [
                CWT_CLAIM_EXT_MAP,
                new Map<number | string, CborValue>([["signin_state", "kmsi"]]),
            ],
        ]);
        expect(() => decodeCwtToken(extSigninState)).toThrow(ClientAuthError);

        const { token: extSubOverride } = await createSignedTestCwt([
            [CWT_CLAIM_SUB, "legit-sub"],
            [
                CWT_CLAIM_EXT_MAP,
                new Map<number | string, CborValue>([["sub", "attacker-sub"]]),
            ],
        ]);
        expect(() => decodeCwtToken(extSubOverride)).toThrow(ClientAuthError);

        const { token: intAndStrCollision } = await createSignedTestCwt([
            [CWT_CLAIM_SUB, "legit-sub"],
            ["sub", "duplicate-string-sub"],
        ]);
        expect(() => decodeCwtToken(intAndStrCollision)).toThrow(
            ClientAuthError
        );

        // 4. Raw CBOR duplicate map keys (both standalone decodeCbor and inside COSE protected header) must be rejected
        // Raw CBOR map(2) { 1: -35 (0x38 0x22), 1: -7 (0x26) }
        const dupHeaderBytes = new Uint8Array([
            0xa2, 0x01, 0x38, 0x22, 0x01, 0x26,
        ]);
        expect(() => decodeCbor(dupHeaderBytes)).toThrow(
            "Duplicate CBOR map key"
        );

        const payloadBytes = encodeDeterministicCbor(
            new Map<number | string, CborValue>([
                [CWT_CLAIM_SUB, "sub-dup-hdr"],
            ])
        );
        const dupProtectedCwt = bytesToBase64Url(
            encodeDeterministicCbor({
                tag: CBOR_TAG_CWT,
                value: {
                    tag: CBOR_TAG_COSE_SIGN1,
                    value: [
                        dupHeaderBytes,
                        new Map<number | string, CborValue>(),
                        payloadBytes,
                        new Uint8Array(64).fill(0xaa),
                    ],
                },
            })
        );
        expect(() => decodeCwtToken(dupProtectedCwt)).toThrow(ClientAuthError);
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
