import {
    decryptEarResponse,
    decryptAsymmetricEarResponse,
    generateAsymmetricEarApv,
    generateAsymmetricEarKey,
    generateEarKey,
    importAsymmetricEarKey,
} from "../../src/crypto/BrowserCrypto.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { base64Encode, urlEncodeArr } from "../../src/encode/Base64Encode.js";
import { BrowserAuthError, BrowserAuthErrorCodes } from "../../src/index.js";
import {
    generateValidEarJWE,
    TEST_TOKEN_RESPONSE,
    validEarJWE,
    validEarJWK,
} from "../utils/StringConstants.js";
import {
    createCipheriv,
    createHash,
    createPublicKey,
    diffieHellman,
    generateKeyPairSync,
    randomBytes,
} from "crypto";

describe("BrowserCrypto Tests", () => {
    describe("decryptAsymmetricEarResponse", () => {
        let client: Awaited<ReturnType<typeof generateAsymmetricEarKey>>;
        let apv: string;
        let jwe: string;
        const plaintext = JSON.stringify({ authenticated: true });

        beforeAll(async () => {
            client = await generateAsymmetricEarKey();
            apv = generateAsymmetricEarApv(client.publicJwk);
            const server = generateKeyPairSync("ec", {
                namedCurve: "secp384r1",
            });
            const publicJwk = server.publicKey.export({ format: "jwk" });
            const uint32 = (value: number) => {
                const bytes = Buffer.alloc(4);
                bytes.writeUInt32BE(value);
                return bytes;
            };
            const lengthPrefix = (bytes: Buffer) =>
                Buffer.concat([uint32(bytes.length), bytes]);
            const apu = Buffer.concat([
                lengthPrefix(Buffer.from("AAD")),
                lengthPrefix(
                    Buffer.concat([
                        Buffer.from([4]),
                        Buffer.from(publicJwk.x!, "base64url"),
                        Buffer.from(publicJwk.y!, "base64url"),
                    ])
                ),
            ]);
            const header = Buffer.from(
                JSON.stringify({
                    alg: "ECDH-ES",
                    enc: "A256GCM",
                    epk: publicJwk,
                    apu: apu.toString("base64url"),
                })
            ).toString("base64url");
            const secret = diffieHellman({
                privateKey: server.privateKey,
                publicKey: createPublicKey({
                    key: { ...client.publicJwk },
                    format: "jwk",
                }),
            });
            const key = createHash("sha256")
                .update(
                    Buffer.concat([
                        uint32(1),
                        secret,
                        lengthPrefix(Buffer.from("A256GCM")),
                        lengthPrefix(apu),
                        lengthPrefix(Buffer.from(apv, "base64url")),
                        uint32(256),
                    ])
                )
                .digest();
            const iv = randomBytes(12);
            const cipher = createCipheriv("aes-256-gcm", key, iv);
            cipher.setAAD(Buffer.from(header));
            const ciphertext = Buffer.concat([
                cipher.update(plaintext),
                cipher.final(),
            ]);
            jwe = [
                header,
                "",
                iv.toString("base64url"),
                ciphertext.toString("base64url"),
                cipher.getAuthTag().toString("base64url"),
            ].join(".");
        });

        it("Decrypts an independently constructed P-384 JOSE response with the request APV", async () => {
            expect(
                await decryptAsymmetricEarResponse(client.privateJwk, apv, jwe)
            ).toBe(plaintext);
        });

        it("Rejects another request's key or APV without returning plaintext", async () => {
            const other = await generateAsymmetricEarKey();
            await expect(
                decryptAsymmetricEarResponse(other.privateJwk, apv, jwe)
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.failedToDecryptEarResponse,
            });
            await expect(
                decryptAsymmetricEarResponse(
                    client.privateJwk,
                    generateAsymmetricEarApv(client.publicJwk),
                    jwe
                )
            ).rejects.toMatchObject({ subError: "jwe_decryption_failed" });
        });

        it.each([2, 3, 4])(
            "Rejects tampering with compact segment %i",
            async (index) => {
                const parts = jwe.split(".");
                const bytes = Buffer.from(parts[index], "base64url");
                bytes[0] ^= 1;
                parts[index] = bytes.toString("base64url");
                await expect(
                    decryptAsymmetricEarResponse(
                        client.privateJwk,
                        apv,
                        parts.join(".")
                    )
                ).rejects.toMatchObject({ subError: "jwe_decryption_failed" });
            }
        );

        it.each([
            { alg: "dir" },
            { alg: "ECDH-ES+A256KW" },
            { enc: "A128GCM" },
            { crit: ["unknown"] },
            { zip: "DEF" },
            { apv: "other-request" },
            { epk: { kty: "EC", crv: "P-256" } },
            { apu: "not base64url" },
        ])("Rejects incompatible protected headers: %j", async (changes) => {
            const parts = jwe.split(".");
            const header = JSON.parse(
                Buffer.from(parts[0], "base64url").toString("utf8")
            );
            parts[0] = Buffer.from(
                JSON.stringify({ ...header, ...changes })
            ).toString("base64url");
            await expect(
                decryptAsymmetricEarResponse(
                    client.privateJwk,
                    apv,
                    parts.join(".")
                )
            ).rejects.toMatchObject({
                subError: "invalid_jwe_format_or_header",
            });
        });

        it("Authenticates otherwise valid protected header bytes", async () => {
            const parts = jwe.split(".");
            const header = JSON.parse(
                Buffer.from(parts[0], "base64url").toString("utf8")
            );
            parts[0] = Buffer.from(
                JSON.stringify({ ...header, typ: "JWT" })
            ).toString("base64url");
            await expect(
                decryptAsymmetricEarResponse(
                    client.privateJwk,
                    apv,
                    parts.join(".")
                )
            ).rejects.toMatchObject({ subError: "jwe_decryption_failed" });
        });

        it("Rejects key-wrapping segments and invalid IV/tag sizes", async () => {
            for (const [index, value] of [
                [1, "wrapped-key"],
                [2, "AA"],
                [4, "AA"],
            ] as const) {
                const parts = jwe.split(".");
                parts[index] = value;
                await expect(
                    decryptAsymmetricEarResponse(
                        client.privateJwk,
                        apv,
                        parts.join(".")
                    )
                ).rejects.toMatchObject({
                    subError: "invalid_jwe_format_or_header",
                });
            }
        });
    });

    describe("generateAsymmetricEarKey", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("Serializes the private P-384 JWK separately and restores a non-exportable key", async () => {
            const { privateJwk, publicJwk } = await generateAsymmetricEarKey();
            const restoredJwk = JSON.parse(JSON.stringify(privateJwk));
            const privateKey = await importAsymmetricEarKey(restoredJwk);

            expect(restoredJwk.d).toBeDefined();
            expect(restoredJwk.x).toBe(publicJwk.x);
            expect(restoredJwk.y).toBe(publicJwk.y);
            expect(privateKey.type).toBe("private");
            expect(privateKey.algorithm).toEqual({
                name: "ECDH",
                namedCurve: "P-384",
            });
            expect(privateKey.extractable).toBe(false);
            expect(privateKey.usages).toEqual(["deriveBits"]);
            expect(publicJwk).toMatchObject({ kty: "EC", crv: "P-384" });
            expect(publicJwk.x).toBeDefined();
            expect(publicJwk.y).toBeDefined();
            expect(publicJwk).not.toHaveProperty("d");
            await expect(
                window.crypto.subtle.exportKey("jwk", privateKey)
            ).rejects.toThrow();
            await expect(
                window.crypto.subtle.exportKey("pkcs8", privateKey)
            ).rejects.toThrow();
        });

        it("Creates independent keys that agree with a peer using the exported public JWK", async () => {
            const first = await generateAsymmetricEarKey();
            const second = await generateAsymmetricEarKey();
            expect(first.publicJwk).not.toEqual(second.publicJwk);
            const firstPrivateKey = await importAsymmetricEarKey(
                JSON.parse(JSON.stringify(first.privateJwk))
            );
            const secondPrivateKey = await importAsymmetricEarKey(
                JSON.parse(JSON.stringify(second.privateJwk))
            );

            const firstPublicKey = await window.crypto.subtle.importKey(
                "jwk",
                first.publicJwk,
                { name: "ECDH", namedCurve: "P-384" },
                false,
                []
            );
            const secondPublicKey = await window.crypto.subtle.importKey(
                "jwk",
                second.publicJwk,
                { name: "ECDH", namedCurve: "P-384" },
                false,
                []
            );
            const firstSecret = await window.crypto.subtle.deriveBits(
                { name: "ECDH", public: secondPublicKey },
                firstPrivateKey,
                384
            );
            const secondSecret = await window.crypto.subtle.deriveBits(
                { name: "ECDH", public: firstPublicKey },
                secondPrivateKey,
                384
            );

            expect(firstSecret.byteLength).toBe(48);
            expect(new Uint8Array(firstSecret)).toEqual(
                new Uint8Array(secondSecret)
            );
        });

        it("Propagates unsupported P-384 without generating a different key", async () => {
            const error = new DOMException(
                "P-384 unavailable",
                "NotSupportedError"
            );
            const generateKeySpy = jest
                .spyOn(window.crypto.subtle, "generateKey")
                .mockRejectedValue(error);

            await expect(generateAsymmetricEarKey()).rejects.toBe(error);
            expect(generateKeySpy).toHaveBeenCalledTimes(1);
            expect(generateKeySpy).toHaveBeenCalledWith(
                { name: "ECDH", namedCurve: "P-384" },
                true,
                ["deriveBits"]
            );
        });

        it("Propagates public-key export errors", async () => {
            const error = new DOMException(
                "Public-key export failed",
                "OperationError"
            );
            jest.spyOn(window.crypto.subtle, "exportKey").mockRejectedValue(
                error
            );

            await expect(generateAsymmetricEarKey()).rejects.toBe(error);
        });

        it("Propagates private-key export errors without returning partial context", async () => {
            const error = new DOMException("Export failed", "OperationError");
            const exportKey = window.crypto.subtle.exportKey.bind(
                window.crypto.subtle
            );
            jest.spyOn(window.crypto.subtle, "exportKey")
                .mockImplementationOnce(exportKey)
                .mockRejectedValueOnce(error);

            await expect(generateAsymmetricEarKey()).rejects.toBe(error);
        });

        it.each([
            { kty: "EC", crv: "P-256", d: "private" },
            { kty: "RSA", crv: "P-384", d: "private" },
            { kty: "EC", crv: "P-384", x: "public", y: "public" },
        ])("Rejects an incompatible private JWK: %j", async (jwk) => {
            const importSpy = jest.spyOn(window.crypto.subtle, "importKey");
            await expect(importAsymmetricEarKey(jwk)).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.asymmetricEarKeyError,
                subError: "invalid_private_key",
            });
            expect(importSpy).not.toHaveBeenCalled();
        });

        it("Reports malformed private JWKs without including the key in the error", async () => {
            await expect(
                importAsymmetricEarKey({
                    kty: "EC",
                    crv: "P-384",
                    d: "invalid-private-key",
                    x: "invalid",
                    y: "invalid",
                })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.asymmetricEarKeyError,
                subError: "private_key_import_failed",
            });
        });
    });

    describe("generateEarKey", () => {
        it("Returns Base64 encoded string of ear_jwk", async () => {
            const key = await window.crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            const rawKey = await window.crypto.subtle.exportKey("raw", key);
            const keyStr = urlEncodeArr(new Uint8Array(rawKey));

            const genKeySpy = jest
                .spyOn(window.crypto.subtle, "generateKey")
                .mockResolvedValue(key);
            const exportKeySpy = jest
                .spyOn(window.crypto.subtle, "exportKey")
                .mockResolvedValue(rawKey);
            const encodedJwk = await generateEarKey();
            expect(genKeySpy).toHaveBeenCalledWith(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            expect(exportKeySpy).toHaveBeenCalledWith("raw", key);

            const decodedJwk = base64Decode(encodedJwk);
            const jwk = JSON.parse(decodedJwk);

            expect(jwk.alg).toEqual("dir");
            expect(jwk.kty).toEqual("oct");
            expect(jwk.k).toEqual(keyStr);
        });
    });

    describe("decryptEarResponse", () => {
        it("Throws if ear_jwe has fewer than 5 parts", (done) => {
            decryptEarResponse(validEarJWK, "header.iv.ciphertext.tag").catch(
                (e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorCodes.failedToDecryptEarResponse
                    );
                    expect(e.subError).toBe("jwe_length");
                    done();
                }
            );
        });

        it("Throws if ear_jwe has more than 5 parts", (done) => {
            decryptEarResponse(
                validEarJWK,
                "header..iv..ciphertext..tag"
            ).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(
                    BrowserAuthErrorCodes.failedToDecryptEarResponse
                );
                expect(e.subError).toBe("jwe_length");
                done();
            });
        });

        it("Throws if earJwk does not have a 'k' property", (done) => {
            const encodedJwk = base64Encode(
                JSON.stringify({ alg: "dir", kty: "oct", key: "testKey" })
            );
            decryptEarResponse(encodedJwk, validEarJWE).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(
                    BrowserAuthErrorCodes.failedToDecryptEarResponse
                );
                expect(e.subError).toBe("import_key");
                done();
            });
        });

        it("Throws if earJwk cannot be B64 decoded", (done) => {
            decryptEarResponse(
                JSON.stringify({ alg: "dir", kty: "oct", k: "testKey" }),
                validEarJWE
            ).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(
                    BrowserAuthErrorCodes.failedToDecryptEarResponse
                );
                expect(e.subError).toBe("import_key");
                done();
            });
        });

        it("Throws if earJwk is not a JSON object", async () => {
            decryptEarResponse("notJSON", validEarJWE).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(
                    BrowserAuthErrorCodes.failedToDecryptEarResponse
                );
                expect(e.subError).toBe("import_key");
            });
        });

        it("Throws if earJwk 'k' property is not a raw encryption key", (done) => {
            decryptEarResponse(
                base64Encode(
                    JSON.stringify({ alg: "dir", kty: "oct", k: "testKey" })
                ),
                validEarJWE
            ).catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(
                    BrowserAuthErrorCodes.failedToDecryptEarResponse
                );
                expect(e.subError).toBe("import_key");
                done();
            });
        });

        it("Throws if ear_jwe cannot be decrypted with the provided key", (done) => {
            generateEarKey().then((jwk: string) => {
                decryptEarResponse(jwk, validEarJWE).catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorCodes.failedToDecryptEarResponse
                    );
                    expect(e.subError).toBe("decrypt");
                    done();
                });
            });
        });

        it("Successfully decrypts ear_jwe with given earJwk", async () => {
            const jwe = await generateValidEarJWE(
                JSON.stringify(TEST_TOKEN_RESPONSE.body),
                validEarJWK
            );
            const decryptedString = await decryptEarResponse(validEarJWK, jwe);
            expect(JSON.parse(decryptedString)).toEqual(
                TEST_TOKEN_RESPONSE.body
            );
        });
    });
});
