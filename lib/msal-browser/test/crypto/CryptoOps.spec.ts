import { CryptoOps } from "../../src/crypto/CryptoOps";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto";
import { createHash } from "crypto";
import { PkceCodes, Logger, PerformanceEventStatus } from "@azure/msal-common";
import {
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_URIS,
} from "../utils/StringConstants";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { generatePkceCodes } from "../../src/crypto/PkceGenerator";
import { StubPerformanceClient } from "@azure/msal-common";
import { DpopProofGenerator } from "../../../msal-common/src/crypto/DpopProofGenerator.js";
import * as BrowserPerformanceEvents from "../../src/telemetry/BrowserPerformanceEvents";
import { TokenBindingKeyManager } from "../../src/crypto/TokenBindingKeyManager";

let mockDatabase = {
    "TestDB.keys": {},
};

const DPOP_KEY_CONTEXT = {
    tokenBindingKeyType: "dpop",
    tokenBindingKeyAlgorithm: "ES256",
    keyScope: `dpop.${TEST_CONFIG.MSAL_CLIENT_ID}.${TEST_CONFIG.validAuthority}`,
    correlationId: TEST_CONFIG.CORRELATION_ID,
} as const;

const SHR_KEY_CONTEXT = {
    tokenBindingKeyType: "shr",
    tokenBindingKeyAlgorithm: "RS256",
    correlationId: TEST_CONFIG.CORRELATION_ID,
} as const;

describe("CryptoOps.ts Unit Tests", () => {
    let cryptoObj: CryptoOps;
    let tokenBindingKeyManager: TokenBindingKeyManager;

    beforeEach(() => {
        cryptoObj = new CryptoOps(new Logger({}));
        tokenBindingKeyManager = new TokenBindingKeyManager(new Logger({}));

        // Mock DatabaseStorage
        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
            async () => {}
        );
        jest.spyOn(DatabaseStorage.prototype, "getItem").mockImplementation(
            async (kid: string) => {
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "setItem").mockImplementation(
            async (kid: string, payload: any) => {
                mockDatabase["TestDB.keys"][kid] = payload;
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "removeItem").mockImplementation(
            async (kid: string) => {
                delete mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "containsKey").mockImplementation(
            async (kid: string) => {
                return !!mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "getKeys").mockImplementation(
            async () => {
                return Object.keys(mockDatabase["TestDB.keys"]);
            }
        );
        jest.spyOn(
            DatabaseStorage.prototype,
            "deleteDatabase"
        ).mockImplementation(async () => {
            mockDatabase["TestDB.keys"] = {};
            return true;
        });
    });

    afterEach(async () => {
        await cryptoObj.clearKeystore(TEST_CONFIG.CORRELATION_ID);
        await tokenBindingKeyManager.clearKeystore(TEST_CONFIG.CORRELATION_ID);
        jest.restoreAllMocks();
        mockDatabase = {
            "TestDB.keys": {},
        };
    });

    it("base64Encode()", () => {
        /**
         * From RFC 4648 Section 10
         * BASE64("") = ""
         * BASE64("f") = "Zg=="
         * BASE64("fo") = "Zm8="
         * BASE64("foo") = "Zm9v"
         * BASE64("foob") = "Zm9vYg=="
         * BASE64("fooba") = "Zm9vYmE="
         * BASE64("foobar") = "Zm9vYmFy"
         */
        expect(cryptoObj.base64Encode("")).toHaveLength(0);
        expect(cryptoObj.base64Encode("f")).toBe("Zg==");
        expect(cryptoObj.base64Encode("fo")).toBe("Zm8=");
        expect(cryptoObj.base64Encode("foo")).toBe("Zm9v");
        expect(cryptoObj.base64Encode("foob")).toBe("Zm9vYg==");
        expect(cryptoObj.base64Encode("fooba")).toBe("Zm9vYmE=");
        expect(cryptoObj.base64Encode("foobar")).toBe("Zm9vYmFy");
    });

    it("base64Decode()", () => {
        /**
         * From RFC 4648 Section 10
         * BASE64("") = ""
         * BASE64("f") = "Zg=="
         * BASE64("fo") = "Zm8="
         * BASE64("foo") = "Zm9v"
         * BASE64("foob") = "Zm9vYg=="
         * BASE64("fooba") = "Zm9vYmE="
         * BASE64("foobar") = "Zm9vYmFy"
         */
        expect(cryptoObj.base64Decode("")).toHaveLength(0);
        expect(cryptoObj.base64Decode("Zg==")).toBe("f");
        expect(cryptoObj.base64Decode("Zm8=")).toBe("fo");
        expect(cryptoObj.base64Decode("Zm9v")).toBe("foo");
        expect(cryptoObj.base64Decode("Zm9vYg==")).toBe("foob");
        expect(cryptoObj.base64Decode("Zm9vYmE=")).toBe("fooba");
        expect(cryptoObj.base64Decode("Zm9vYmFy")).toBe("foobar");
    });

    describe("Localization tests", () => {
        it("Arabic", () => {
            const TEST_STRING = "أهـــلاً12";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Chinese (Simplified)", () => {
            const TEST_STRING =
                "你好熊猫僜刓嘰塡奬媆孿偁乢猒峗芲偁A偄E偆I偊O偍U";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Chinese (Traditional)", () => {
            const TEST_STRING =
                "僜刓嘰塡奬媆孿屋台灣一才中丙禳讒讖籲乂氕氶汋纘鼊龤牷A礜I略U礎E漼O尐赨塿槙箤踊ａｂｃＡＢＣ巢巢巢悴矱悴矱勗脣勗脣";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("German", () => {
            const TEST_STRING = "freistoß für böse";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Hebrew", () => {
            const TEST_STRING = "אם במקרה אף שכחת לנסוע צפון לזיג'ץ טד,ן.";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Hindi", () => {
            const TEST_STRING = "नमस्ते धन्यवाद";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Japanese", () => {
            const TEST_STRING =
                "とよた小百合俊晴㊞ソ十申暴構能雲契活神点農ボ施倍府本宮マ笠急党図迎 ミ円救降冬梅ゼ夕票充端納 ゾ従転脳評競怜蒟栁ょ溷瑯";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);

            const TEST_STRING2 = "制御ポリシー博俊 中 とよた小百合俊晴㊞ソ";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING2))
            ).toBe(TEST_STRING2);
        });

        it("Korean", () => {
            const TEST_STRING = "도망각하갂詰野";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Thai", () => {
            const TEST_STRING = "กุ้งจิ้มน้ปลาตั้งจเรียน";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Turkish", () => {
            const TEST_STRING = "İkşzler Açık iıüğİIÜĞ";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Portugese", () => {
            const TEST_STRING = "áéíóúàêôãç";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Russian", () => {
            const TEST_STRING = "яЧчЁёр";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Italian", () => {
            const TEST_STRING = "àÀèÈéÉìÌòÒùÙ";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("French", () => {
            const TEST_STRING = "æÆœŒçÇîÎ";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Greek", () => {
            const TEST_STRING = "Σσς";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Czech", () => {
            const TEST_STRING = "ŠšŤŽ";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Danish", () => {
            const TEST_STRING = "åæø";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });

        it("Finnish", () => {
            const TEST_STRING = "åäö";
            expect(
                cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))
            ).toBe(TEST_STRING);
        });
    });

    it("generatePkceCode() creates a valid Pkce code", async () => {
        jest.spyOn(
            BrowserCrypto,
            "sha256Digest"
            // @ts-ignore
        ).mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
            return Promise.resolve(
                createHash("SHA256").update(Buffer.from(data)).digest()
            );
        });

        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const generatedCodes: PkceCodes = await generatePkceCodes(
            new StubPerformanceClient(),
            new Logger({}),
            RANDOM_TEST_GUID
        );
        expect(regExp.test(generatedCodes.challenge)).toBe(true);
        expect(regExp.test(generatedCodes.verifier)).toBe(true);
    });

    it("TokenBindingKeyManager.provisionTokenBindingKey() generates a valid request thumbprint", async () => {
        jest.setTimeout(30000);
        jest.spyOn(
            BrowserCrypto,
            "sha256Digest"
            // @ts-ignore
        ).mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
            return Promise.resolve(
                createHash("SHA256").update(Buffer.from(data)).digest()
            );
        });
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto, "generateKeyPair");
        const exportJwkSpy = jest.spyOn(BrowserCrypto, "exportJwk");
        const pkThumbprint =
            await tokenBindingKeyManager.provisionTokenBindingKey({
                correlationId: TEST_CONFIG.CORRELATION_ID,
                tokenBindingKeyType: "shr",
                tokenBindingKeyAlgorithm: "RS256",
            });
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        expect(generateKeyPairSpy).toHaveBeenCalledWith(
            false,
            ["sign", "verify"],
            BrowserCrypto.RSA_KEYGEN_ALGORITHM_OPTIONS
        );
        const result = await generateKeyPairSpy.mock.results[0].value;
        expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
        expect(regExp.test(pkThumbprint)).toBe(true);
        expect(mockDatabase["TestDB.keys"][pkThumbprint]).not.toBe(undefined);
        expect(
            mockDatabase["TestDB.keys"][pkThumbprint].privateKey.extractable
        ).toBe(false);
    }, 30000);

    it("removeTokenBindingKey() removes the specified key from storage", async () => {
        jest.spyOn(
            BrowserCrypto,
            "sha256Digest"
            // @ts-ignore
        ).mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
            return Promise.resolve(
                createHash("SHA256").update(Buffer.from(data)).digest()
            );
        });
        const pkThumbprint =
            await tokenBindingKeyManager.provisionTokenBindingKey({
                correlationId: TEST_CONFIG.CORRELATION_ID,
                tokenBindingKeyType: "shr",
                tokenBindingKeyAlgorithm: "RS256",
            });
        const key = mockDatabase["TestDB.keys"][pkThumbprint];
        await cryptoObj.removeTokenBindingKey(
            pkThumbprint,
            TEST_CONFIG.CORRELATION_ID
        );
        expect(key).not.toBe(undefined);
        expect(mockDatabase["TestDB.keys"][pkThumbprint]).toBe(undefined);
    }, 30000);

    it("signTokenBindingJwt() throws signingKeyNotFoundInStorage error if signing keypair is not found in storage", async () => {
        await expect(
            cryptoObj.signTokenBindingJwt(
                { alg: "RS256" },
                {},
                "testString",
                TEST_CONFIG.CORRELATION_ID
            )
        ).rejects.toThrow(
            createBrowserAuthError(
                BrowserAuthErrorCodes.cryptoKeyNotFound,
                TEST_CONFIG.CORRELATION_ID
            )
        );
    }, 30000);

    it("emits token-binding key metadata for SHR and DPoP key generation", async () => {
        const performanceClient = new StubPerformanceClient();
        const endMeasurement = jest.fn();
        jest.spyOn(performanceClient, "startMeasurement").mockImplementation(
            (measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            })
        );
        tokenBindingKeyManager = new TokenBindingKeyManager(
            new Logger({}),
            performanceClient
        );

        await tokenBindingKeyManager.provisionTokenBindingKey(SHR_KEY_CONTEXT);
        await tokenBindingKeyManager.provisionTokenBindingKey(DPOP_KEY_CONTEXT);
        await tokenBindingKeyManager.provisionTokenBindingKey(DPOP_KEY_CONTEXT);

        expect(performanceClient.startMeasurement).toHaveBeenCalledWith(
            BrowserPerformanceEvents.CryptoOptsGetPublicKeyThumbprint,
            TEST_CONFIG.CORRELATION_ID
        );
        expect(endMeasurement).toHaveBeenNthCalledWith(1, {
            success: true,
            tokenBindingKeyType: "shr",
            tokenBindingKeyAlgorithm: "RS256",
            tokenBindingKeyCacheHit: false,
        });
        expect(endMeasurement).toHaveBeenNthCalledWith(2, {
            success: true,
            tokenBindingKeyType: "dpop",
            tokenBindingKeyAlgorithm: "ES256",
            tokenBindingKeyCacheHit: false,
        });
        expect(endMeasurement).toHaveBeenNthCalledWith(3, {
            success: true,
            tokenBindingKeyType: "dpop",
            tokenBindingKeyAlgorithm: "ES256",
            tokenBindingKeyCacheHit: true,
        });
    }, 30000);

    it("emits token-binding key metadata when key generation fails", async () => {
        const performanceClient = new StubPerformanceClient();
        const endMeasurement = jest.fn();
        jest.spyOn(performanceClient, "startMeasurement").mockImplementation(
            (measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            })
        );
        jest.spyOn(BrowserCrypto, "generateKeyPair").mockRejectedValue(
            new Error("key generation failed")
        );
        tokenBindingKeyManager = new TokenBindingKeyManager(
            new Logger({}),
            performanceClient
        );

        await expect(
            tokenBindingKeyManager.provisionTokenBindingKey(DPOP_KEY_CONTEXT)
        ).rejects.toThrow("key generation failed");

        expect(endMeasurement).toHaveBeenCalledWith({
            success: false,
            tokenBindingKeyType: "dpop",
            tokenBindingKeyAlgorithm: "ES256",
            tokenBindingKeyCacheHit: false,
        });
    }, 30000);

    it("emits token-binding key metadata when scoped key lookup fails", async () => {
        const performanceClient = new StubPerformanceClient();
        const endMeasurement = jest.fn();
        jest.spyOn(performanceClient, "startMeasurement").mockImplementation(
            (measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            })
        );
        jest.spyOn(DatabaseStorage.prototype, "getKeys").mockRejectedValueOnce(
            new Error("scoped lookup failed")
        );
        tokenBindingKeyManager = new TokenBindingKeyManager(
            new Logger({}),
            performanceClient
        );

        await expect(
            tokenBindingKeyManager.provisionTokenBindingKey(DPOP_KEY_CONTEXT)
        ).rejects.toThrow("scoped lookup failed");

        expect(endMeasurement).toHaveBeenCalledWith({
            success: false,
            tokenBindingKeyType: "dpop",
            tokenBindingKeyAlgorithm: "ES256",
            tokenBindingKeyCacheHit: false,
        });
    }, 30000);

    it("emits SHR key generation metadata when key generation fails", async () => {
        const performanceClient = new StubPerformanceClient();
        const endMeasurement = jest.fn();
        jest.spyOn(performanceClient, "startMeasurement").mockImplementation(
            (measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            })
        );
        jest.spyOn(BrowserCrypto, "generateKeyPair").mockRejectedValue(
            new Error("key generation failed")
        );
        tokenBindingKeyManager = new TokenBindingKeyManager(
            new Logger({}),
            performanceClient
        );

        await expect(
            tokenBindingKeyManager.provisionTokenBindingKey(SHR_KEY_CONTEXT)
        ).rejects.toThrow("key generation failed");

        expect(endMeasurement).toHaveBeenCalledWith({
            success: false,
            tokenBindingKeyType: "shr",
            tokenBindingKeyAlgorithm: "RS256",
            tokenBindingKeyCacheHit: false,
        });
    }, 30000);

    it("emits token-binding signing metadata for SHR and DPoP signatures", async () => {
        const performanceClient = new StubPerformanceClient();
        const endMeasurement = jest.fn();
        jest.spyOn(performanceClient, "startMeasurement").mockImplementation(
            (measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            })
        );
        cryptoObj = new CryptoOps(new Logger({}), performanceClient);

        const popKeyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            SHR_KEY_CONTEXT
        );
        await tokenBindingKeyManager.provisionTokenBindingKey(DPOP_KEY_CONTEXT);
        const dpopKeyId = await tokenBindingKeyManager.provisionTokenBindingKey(
            DPOP_KEY_CONTEXT
        );
        const dpopPublicJwk =
            await tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                dpopKeyId,
                TEST_CONFIG.CORRELATION_ID,
                DPOP_KEY_CONTEXT
            );
        endMeasurement.mockClear();

        await cryptoObj.signTokenBindingJwt(
            { alg: "RS256", typ: "pop", kid: "pop-kid" },
            { at: "access-token" },
            popKeyId,
            TEST_CONFIG.CORRELATION_ID
        );
        await cryptoObj.signTokenBindingJwt(
            { alg: "ES256", typ: "dpop+jwt", jwk: dpopPublicJwk },
            { htm: "POST", htu: TEST_URIS.TEST_AUTH_ENDPT, iat: 1, jti: "jti" },
            dpopKeyId,
            TEST_CONFIG.CORRELATION_ID,
            DPOP_KEY_CONTEXT
        );

        expect(performanceClient.startMeasurement).toHaveBeenCalledWith(
            BrowserPerformanceEvents.CryptoOptsSignJwt,
            TEST_CONFIG.CORRELATION_ID
        );
        expect(endMeasurement).toHaveBeenNthCalledWith(1, {
            success: true,
            tokenBindingKeyType: "shr",
            tokenBindingKeyAlgorithm: "RS256",
        });
        expect(endMeasurement).toHaveBeenNthCalledWith(2, {
            success: true,
            tokenBindingKeyType: "dpop",
            tokenBindingKeyAlgorithm: "ES256",
        });
    }, 30000);

    it("emits token-binding signing metadata when signing fails", async () => {
        const performanceClient = new StubPerformanceClient();
        const endMeasurement = jest.fn();
        jest.spyOn(performanceClient, "startMeasurement").mockImplementation(
            (measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            })
        );
        cryptoObj = new CryptoOps(new Logger({}), performanceClient);

        await expect(
            cryptoObj.signTokenBindingJwt(
                { alg: "ES256", typ: "dpop+jwt", jwk: {} },
                {
                    htm: "POST",
                    htu: TEST_URIS.TEST_AUTH_ENDPT,
                    iat: 1,
                    jti: "jti",
                },
                "missing-key-id",
                TEST_CONFIG.CORRELATION_ID,
                DPOP_KEY_CONTEXT
            )
        ).rejects.toThrow(
            createBrowserAuthError(
                BrowserAuthErrorCodes.cryptoKeyNotFound,
                TEST_CONFIG.CORRELATION_ID
            )
        );

        expect(endMeasurement).toHaveBeenCalledWith({
            success: false,
        });
    }, 30000);

    it("hashString() returns a valid SHA-256 hash of an input string", async () => {
        jest.spyOn(BrowserCrypto, "sha256Digest").mockImplementation(
            // @ts-ignore
            (data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            }
        );
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const result = await cryptoObj.hashString("testString");
        expect(regExp.test(result)).toBe(true);
    });

    describe("DPoP internal crypto helpers", () => {
        it("computeJwkThumbprint returns a valid base64url string of expected length", async () => {
            jest.spyOn(
                BrowserCrypto,
                "sha256Digest"
                // @ts-ignore
            ).mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            });

            const keyPair = await BrowserCrypto.generateKeyPair(
                false,
                ["sign", "verify"],
                BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
            );
            const publicJwk = await BrowserCrypto.exportJwk(keyPair.publicKey);
            const thumbprint = await BrowserCrypto.computeJwkThumbprint(
                publicJwk
            );

            // SHA-256 base64url is always 43 characters (base64url alphabet: A-Z a-z 0-9 - _)
            const regExp = new RegExp("^[A-Za-z0-9_-]{43}$");
            expect(regExp.test(thumbprint)).toBe(true);
        }, 10000);

        it("computeJwkThumbprint computes RFC 7638 thumbprints for RSA public JWKs", async () => {
            jest.spyOn(
                BrowserCrypto,
                "sha256Digest"
                // @ts-ignore
            ).mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            });

            const publicJwk = {
                kty: "RSA",
                e: "AQAB",
                n: "test-modulus",
            };
            const thumbprint = await BrowserCrypto.computeJwkThumbprint(
                publicJwk
            );
            const expectedThumbprint = createHash("SHA256")
                .update(JSON.stringify(publicJwk, ["e", "kty", "n"]))
                .digest("base64url");

            expect(thumbprint).toBe(expectedThumbprint);
        });

        it("computeJwkThumbprint rejects unsupported public JWK key types", async () => {
            await expect(
                BrowserCrypto.computeJwkThumbprint({
                    kty: "oct",
                    k: "symmetric-key",
                })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.invalidPublicJwk,
                subError: "unsupported_jwk_kty",
            });
        });

        it("computeJwkThumbprint rejects missing public JWK key types", async () => {
            await expect(
                BrowserCrypto.computeJwkThumbprint({
                    crv: "P-256",
                    x: "x-coordinate",
                    y: "y-coordinate",
                })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.invalidPublicJwk,
                subError: "missing_jwk_kty",
            });
        });

        it("computeJwkThumbprint rejects missing or empty public JWK coordinates", async () => {
            await expect(
                BrowserCrypto.computeJwkThumbprint({
                    kty: "EC",
                    crv: "P-256",
                    x: "x-coordinate",
                })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.invalidPublicJwk,
                subError: "missing_jwk_member",
            });

            await expect(
                BrowserCrypto.computeJwkThumbprint({
                    kty: "EC",
                    crv: "P-256",
                    x: "",
                    y: "y-coordinate",
                })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.invalidPublicJwk,
                subError: "empty_jwk_member",
            });
        });

        it("signTokenBindingJwt uses requested signing params when compatible with the stored key", async () => {
            const performanceClient = new StubPerformanceClient();
            const endMeasurement = jest.fn();
            jest.spyOn(
                performanceClient,
                "startMeasurement"
            ).mockImplementation((measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            }));
            cryptoObj = new CryptoOps(new Logger({}), performanceClient);
            const keyPair = await BrowserCrypto.generateKeyPair(
                false,
                ["sign", "verify"],
                BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
            );
            const publicJwk = await BrowserCrypto.exportJwk(keyPair.publicKey);
            const keyId = await BrowserCrypto.computeJwkThumbprint(publicJwk);
            mockDatabase["TestDB.keys"][keyId] = {
                privateKey: keyPair.privateKey,
                publicKey: keyPair.publicKey,
                tokenBindingKeyType: "dpop",
                tokenBindingKeyAlgorithm: "ES256",
            };
            const signSpy = jest.spyOn(BrowserCrypto, "sign");

            const proof = await cryptoObj.signTokenBindingJwt(
                { alg: "ES256", typ: "dpop+jwt", jwk: publicJwk },
                {
                    htm: "POST",
                    htu: TEST_URIS.TEST_AUTH_ENDPT,
                    iat: 1,
                    jti: "jti",
                },
                keyId,
                TEST_CONFIG.CORRELATION_ID
            );

            expect(endMeasurement).toHaveBeenCalledWith({
                success: true,
                tokenBindingKeyType: "dpop",
                tokenBindingKeyAlgorithm: "ES256",
            });
            expect(signSpy.mock.calls[0][0]).toBe(keyPair.privateKey);
            expect(signSpy.mock.calls[0][2]).toEqual(
                BrowserCrypto.ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS
            );
            const [encodedHeader, encodedPayload, signature] = proof.split(".");
            const verified = await window.crypto.subtle.verify(
                BrowserCrypto.ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS,
                keyPair.publicKey,
                Buffer.from(signature, "base64url"),
                new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
            );
            expect(verified).toBe(true);
        }, 10000);

        it("signTokenBindingJwt rejects DPoP header JWKs that do not match the signing key", async () => {
            const signingKeyPair = await BrowserCrypto.generateKeyPair(
                false,
                ["sign", "verify"],
                BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
            );
            const signingPublicJwk = await BrowserCrypto.exportJwk(
                signingKeyPair.publicKey
            );
            const signingKeyId = await BrowserCrypto.computeJwkThumbprint(
                signingPublicJwk
            );
            mockDatabase["TestDB.keys"][signingKeyId] = {
                privateKey: signingKeyPair.privateKey,
                publicKey: signingKeyPair.publicKey,
                tokenBindingKeyType: "dpop",
                tokenBindingKeyAlgorithm: "ES256",
            };
            const mismatchedKeyPair = await BrowserCrypto.generateKeyPair(
                false,
                ["sign", "verify"],
                BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
            );
            const mismatchedPublicJwk = await BrowserCrypto.exportJwk(
                mismatchedKeyPair.publicKey
            );

            await expect(
                cryptoObj.signTokenBindingJwt(
                    { alg: "ES256", typ: "dpop+jwt", jwk: mismatchedPublicJwk },
                    {
                        htm: "POST",
                        htu: TEST_URIS.TEST_AUTH_ENDPT,
                        iat: 1,
                        jti: "jti",
                    },
                    signingKeyId,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).rejects.toThrow(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.tokenBindingKeyJwkThumbprintMismatch,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        }, 10000);

        it("signTokenBindingJwt rejects requested algorithms incompatible with the stored key", async () => {
            const performanceClient = new StubPerformanceClient();
            const endMeasurement = jest.fn();
            jest.spyOn(
                performanceClient,
                "startMeasurement"
            ).mockImplementation((measureName, correlationId) => ({
                end: endMeasurement,
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: PerformanceEventStatus.InProgress,
                    authority: "",
                    libraryName: "",
                    libraryVersion: "",
                    clientId: "",
                    name: measureName,
                    startTimeMs: Date.now(),
                    correlationId: correlationId || "",
                },
            }));
            cryptoObj = new CryptoOps(new Logger({}), performanceClient);
            const keyPair = await BrowserCrypto.generateKeyPair(
                false,
                ["sign", "verify"],
                BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
            );
            const publicJwk = await BrowserCrypto.exportJwk(keyPair.publicKey);
            const keyId = await BrowserCrypto.computeJwkThumbprint(publicJwk);
            mockDatabase["TestDB.keys"][keyId] = {
                privateKey: keyPair.privateKey,
                publicKey: keyPair.publicKey,
                tokenBindingKeyType: "dpop",
                tokenBindingKeyAlgorithm: "ES256",
            };

            await expect(
                cryptoObj.signTokenBindingJwt(
                    { alg: "RS256", typ: "dpop+jwt", jwk: publicJwk },
                    {
                        htm: "POST",
                        htu: TEST_URIS.TEST_AUTH_ENDPT,
                        iat: 1,
                        jti: "jti",
                    },
                    keyId,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).rejects.toThrow(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.tokenBindingKeyAlgorithmMismatch,
                    TEST_CONFIG.CORRELATION_ID
                )
            );

            expect(endMeasurement).toHaveBeenCalledWith({
                success: false,
                tokenBindingKeyType: "dpop",
                tokenBindingKeyAlgorithm: "ES256",
            });
        }, 10000);

        it("signTokenBindingJwt rejects unsupported stored key algorithms", async () => {
            mockDatabase["TestDB.keys"]["unsupported-key-id"] = {
                privateKey: {
                    algorithm: {
                        name: "ECDSA",
                        namedCurve: "P-384",
                    },
                    extractable: false,
                    type: "private",
                    usages: ["sign"],
                } as CryptoKey,
                publicKey: {
                    algorithm: {
                        name: "ECDSA",
                        namedCurve: "P-384",
                    },
                    extractable: true,
                    type: "public",
                    usages: ["verify"],
                } as CryptoKey,
            };

            await expect(
                cryptoObj.signTokenBindingJwt(
                    { alg: "ES384", typ: "dpop+jwt" },
                    {
                        htm: "POST",
                        htu: TEST_URIS.TEST_AUTH_ENDPT,
                        iat: 1,
                        jti: "jti",
                    },
                    "unsupported-key-id",
                    TEST_CONFIG.CORRELATION_ID
                )
            ).rejects.toThrow(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.unsupportedTokenBindingAlgorithm,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("signTokenBindingJwt rejects missing JWT header algorithm", async () => {
            const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
                DPOP_KEY_CONTEXT
            );

            await expect(
                cryptoObj.signTokenBindingJwt(
                    { typ: "dpop+jwt", jwk: {} },
                    {
                        htm: "POST",
                        htu: TEST_URIS.TEST_AUTH_ENDPT,
                        iat: 1,
                        jti: "jti",
                    },
                    keyId,
                    TEST_CONFIG.CORRELATION_ID,
                    DPOP_KEY_CONTEXT
                )
            ).rejects.toThrow(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.missingTokenBindingJwtAlgorithm,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("generates a DPoP proof whose embedded public key verifies the signature", async () => {
            const keyId = await tokenBindingKeyManager.provisionTokenBindingKey(
                DPOP_KEY_CONTEXT
            );
            const publicJwk =
                await tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                    keyId,
                    TEST_CONFIG.CORRELATION_ID,
                    DPOP_KEY_CONTEXT
                );
            const dpopPublicJwk: Record<string, unknown> = {};
            Object.entries(publicJwk).forEach(([key, value]) => {
                dpopPublicJwk[key] = value;
            });
            const dpopProofGenerator = new DpopProofGenerator(
                cryptoObj,
                tokenBindingKeyManager
            );
            const proof = await dpopProofGenerator.generateTokenProof(
                {
                    tokenEndpoint: TEST_URIS.TEST_AUTH_ENDPT,
                    keyId,
                    keyContext: DPOP_KEY_CONTEXT,
                },
                TEST_CONFIG.CORRELATION_ID
            );
            const [encodedHeader, encodedClaims, signature] = proof.split(".");
            if (!encodedHeader || !encodedClaims || !signature) {
                throw new Error("Expected compact DPoP proof JWT");
            }
            const proofHeader = JSON.parse(
                Buffer.from(encodedHeader, "base64url").toString("utf8")
            );
            const proofPublicKey = await BrowserCrypto.importJwk(
                proofHeader.jwk,
                true,
                ["verify"],
                BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
            );
            const verified = await window.crypto.subtle.verify(
                BrowserCrypto.ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS,
                proofPublicKey,
                Buffer.from(signature, "base64url"),
                new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`)
            );

            expect(proofHeader.jwk).toEqual(dpopPublicJwk);
            expect(verified).toBe(true);
        }, 10000);

        it("generates a DPoP proof when IndexedDB is unavailable and signing uses a separate manager", async () => {
            jest.spyOn(DatabaseStorage.prototype, "setItem").mockRejectedValue(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.databaseUnavailable,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
            jest.spyOn(DatabaseStorage.prototype, "getItem").mockRejectedValue(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.databaseUnavailable,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
            jest.spyOn(DatabaseStorage.prototype, "getKeys").mockRejectedValue(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.databaseUnavailable,
                    TEST_CONFIG.CORRELATION_ID
                )
            );
            const provisioningKeyManager = new TokenBindingKeyManager(
                new Logger({})
            );
            const dpopProofGenerator = new DpopProofGenerator(
                cryptoObj,
                provisioningKeyManager
            );

            const keyId = await provisioningKeyManager.provisionTokenBindingKey(
                DPOP_KEY_CONTEXT
            );
            const proof = await dpopProofGenerator.generateTokenProof(
                {
                    tokenEndpoint: TEST_URIS.TEST_AUTH_ENDPT,
                    keyId,
                    keyContext: DPOP_KEY_CONTEXT,
                },
                TEST_CONFIG.CORRELATION_ID
            );

            expect(proof.split(".")).toHaveLength(3);
        }, 10000);
    });

    it("throws if crypto is unavailable", () => {
        const mockedWindow = window;
        //@ts-ignore
        delete mockedWindow.crypto;
        jest.spyOn(global, "window", "get").mockReturnValue(mockedWindow);

        expect(() => new CryptoOps(new Logger({}))).toThrow();
    });
});
