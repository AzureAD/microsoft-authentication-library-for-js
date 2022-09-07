import { CryptoOps } from "../../src/crypto/CryptoOps";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { createHash } from "crypto";
import { PkceCodes, BaseAuthRequest, Logger } from "@azure/msal-common";
import { TEST_URIS } from "../utils/StringConstants";
import { BrowserAuthError } from "../../src";
import { ModernBrowserCrypto } from "../../src/crypto/ModernBrowserCrypto";
import { MsBrowserCrypto } from "../../src/crypto/MsBrowserCrypto";
import { MsrBrowserCrypto } from "../../src/crypto/MsrBrowserCrypto";
import nodeCrypto from "crypto";

const msrCrypto = require("../polyfills/msrcrypto.min");

let mockDatabase = {
    "TestDB.keys": {}
};

// Mock DatabaseStorage
jest.mock("../../src/cache/DatabaseStorage", () => {
    return {
        DatabaseStorage: jest.fn().mockImplementation(() => {
            return {
                dbName: "TestDB",
                version: 1,
                tableName: "TestDB.keys",
                open: () => {},
                getItem: (kid: string) => {
                    return mockDatabase["TestDB.keys"][kid];
                },
                setItem: (kid: string, payload: any) => {
                    mockDatabase["TestDB.keys"][kid] = payload;
                    return mockDatabase["TestDB.keys"][kid];
                },
                removeItem: (kid: string) => {
                    delete mockDatabase["TestDB.keys"][kid];
                },
                containsKey: (kid: string) => {
                    return !!(mockDatabase["TestDB.keys"][kid]);
                }
            }
      })
    }
});

describe("CryptoOps.ts Unit Tests", () => {
    let cryptoObj: CryptoOps;
    let browserCrypto: BrowserCrypto;
    let oldWindowCrypto = window.crypto;

    beforeEach(() => {
        browserCrypto = new BrowserCrypto(new Logger({}))
        cryptoObj = new CryptoOps(new Logger({}));
        oldWindowCrypto = window.crypto;
        //@ts-ignore
        window.crypto = {
            ...oldWindowCrypto,
            ...msrCrypto
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
        mockDatabase = {
            "TestDB.keys": {}
        };
        //@ts-ignore
        window.crypto = oldWindowCrypto;
    });

    it("createNewGuid()", () => {
        expect(new GuidGenerator(browserCrypto).isGuid(cryptoObj.createNewGuid())).toBe(true);
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
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Chinese (Simplified)", () => {
            const TEST_STRING = "你好熊猫僜刓嘰塡奬媆孿偁乢猒峗芲偁A偄E偆I偊O偍U";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Chinese (Traditional)", () => {
            const TEST_STRING = "僜刓嘰塡奬媆孿屋台灣一才中丙禳讒讖籲乂氕氶汋纘鼊龤牷A礜I略U礎E漼O尐赨塿槙箤踊ａｂｃＡＢＣ巢巢巢悴矱悴矱勗脣勗脣";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("German", () => {
            const TEST_STRING = "freistoß für böse";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Hebrew", () => {
            const TEST_STRING = "אם במקרה אף שכחת לנסוע צפון לזיג'ץ טד,ן.";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Hindi", () => {
            const TEST_STRING = "नमस्ते धन्यवाद";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Japanese", () => {
            const TEST_STRING = "とよた小百合俊晴㊞ソ十申暴構能雲契活神点農ボ施倍府本宮マ笠急党図迎 ミ円救降冬梅ゼ夕票充端納 ゾ従転脳評競怜蒟栁ょ溷瑯";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Korean", () => {
            const TEST_STRING = "도망각하갂詰野";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Thai", () => {
            const TEST_STRING = "กุ้งจิ้มน้ปลาตั้งจเรียน";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Turkish", () => {
            const TEST_STRING = "İkşzler Açık iıüğİIÜĞ";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Portugese", () => {
            const TEST_STRING = "áéíóúàêôãç";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Russian", () => {
            const TEST_STRING = "яЧчЁёр";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Italian", () => {
            const TEST_STRING = "àÀèÈéÉìÌòÒùÙ";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("French", () => {
            const TEST_STRING = "æÆœŒçÇîÎ";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Greek", () => {
            const TEST_STRING = "Σσς";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Czech", () => {
            const TEST_STRING = "ŠšŤŽ";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Danish", () => {
            const TEST_STRING = "åæø";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });

        it("Finnish", () => {
            const TEST_STRING = "åäö";
            expect(cryptoObj.base64Decode(cryptoObj.base64Encode(TEST_STRING))).toBe(TEST_STRING);
        });
    });

    it("generatePkceCode() creates a valid Pkce code", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "sha256Digest").mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });

        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const generatedCodes: PkceCodes = await cryptoObj.generatePkceCodes();
        expect(regExp.test(generatedCodes.challenge)).toBe(true);
        expect(regExp.test(generatedCodes.verifier)).toBe(true);
    });

    it("getPublicKeyThumbprint() generates a valid request thumbprint", async () => {
        jest.setTimeout(30000);
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "sha256Digest").mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto.prototype, "generateKeyPair");
        const exportJwkSpy = jest.spyOn(BrowserCrypto.prototype, "exportJwk");
        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint({resourceRequestMethod: "POST", resourceRequestUri: TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS} as BaseAuthRequest);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        expect(generateKeyPairSpy).toHaveBeenCalledWith(true, ["sign", "verify"]);
        const result = await generateKeyPairSpy.mock.results[0].value;
        expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
        expect(regExp.test(pkThumbprint)).toBe(true);
        expect(mockDatabase["TestDB.keys"][pkThumbprint]).not.toBe(undefined);
    }, 30000);

    it("removeTokenBindingKey() removes the specified key from storage", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "sha256Digest").mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint({resourceRequestMethod: "POST", resourceRequestUri: TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS} as BaseAuthRequest);
        const key = mockDatabase["TestDB.keys"][pkThumbprint];
        const keyDeleted = await cryptoObj.removeTokenBindingKey(pkThumbprint);
        expect(key).not.toBe(undefined);
        expect(mockDatabase["TestDB.keys"][pkThumbprint]).toBe(undefined);
        expect(keyDeleted).toBe(true);
    }, 30000);

    it("signJwt() throws signingKeyNotFoundInStorage error if signing keypair is not found in storage", async () => {
        expect(cryptoObj.signJwt({}, "testString")).rejects.toThrow(BrowserAuthError.createSigningKeyNotFoundInStorageError("testString"));
    }, 30000);

    it("hashString() returns a valid SHA-256 hash of an input string", async() => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype, "sha256Digest").mockImplementation((data: Uint8Array): Promise<ArrayBuffer> => {
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const result = await cryptoObj.hashString("testString");
        expect(regExp.test(result)).toBe(true);
    });

    describe("Browser Crypto Interfaces", () => {
        beforeAll(() => {
            // Ensure MSR Crypto is only used when the other interfaces arent present, even if MSR Crypto is loaded
            window.msrCrypto = msrCrypto;
        });

        afterAll(() => {
            // @ts-ignore
            window.msrCrypto = undefined;
        })

        it("uses modern crypto if available", () => {
            const crypto = new BrowserCrypto(new Logger({}));
            // @ts-ignore
            expect(crypto.subtleCrypto).toBeInstanceOf(ModernBrowserCrypto);
        });
        
        it("uses MS crypto if available", () => {
            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasBrowserCrypto").mockReturnValue(false);

            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasIECrypto").mockReturnValue(true);

            const crypto = new BrowserCrypto(new Logger({}));
            // @ts-ignore
            expect(crypto.subtleCrypto).toBeInstanceOf(MsBrowserCrypto);
        });

        it("uses MSR crypto if available", () => {
            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasBrowserCrypto").mockReturnValue(false);

            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasIECrypto").mockReturnValue(false);

            const crypto = new BrowserCrypto(new Logger({}), {
                useMsrCrypto: true,
                entropy: nodeCrypto.randomBytes(48)
            });
            
            // @ts-ignore
            expect(crypto.subtleCrypto).toBeInstanceOf(MsrBrowserCrypto);
        });

        it("throws if MSR Crypto is available but useMsrCrypto is not enabled", () => {
            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasBrowserCrypto").mockReturnValue(false);

            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasIECrypto").mockReturnValue(false);

            expect(() => new BrowserCrypto(new Logger({}), {
                useMsrCrypto: false,
                entropy: nodeCrypto.randomBytes(48)
            })).toThrow();
        });

        it("throws if MSR Crypto is available but entropy is not provided", () => {
            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasBrowserCrypto").mockReturnValue(false);

            // @ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "hasIECrypto").mockReturnValue(false);

            expect(() => new BrowserCrypto(new Logger({}), {
                useMsrCrypto: true,
                entropy: undefined
            })).toThrow();
        });
    })
});
