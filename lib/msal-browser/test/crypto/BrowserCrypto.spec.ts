import {
    decryptEarResponse,
    generateEarKey,
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

describe("BrowserCrypto Tests", () => {
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
