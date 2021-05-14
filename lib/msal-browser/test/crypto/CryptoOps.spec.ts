import { expect } from "chai";
import sinon from "sinon";
import { CryptoOps, CachedKeyPair } from "../../src/crypto/CryptoOps";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import crypto from "crypto";
import { AuthenticationScheme, PkceCodes } from "@azure/msal-common";
import { TEST_CONFIG, TEST_URIS, BROWSER_CRYPTO, KEY_USAGES, TEST_POP_VALUES } from "../utils/StringConstants";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";

const PUBLIC_EXPONENT: Uint8Array = new Uint8Array([0x01, 0x00, 0x01]);

const AT_BINDING_KEY_OPTIONS = {
    keyGenAlgorithmOptions: {
        name: BROWSER_CRYPTO.PKCS1_V15_KEYGEN_ALG,
        hash: {
            name:  BROWSER_CRYPTO.S256_HASH_ALG
        },
        modulusLength: BROWSER_CRYPTO.MODULUS_LENGTH,
        publicExponent: PUBLIC_EXPONENT
    },
    keypairUsages: KEY_USAGES.AT_BINDING.KEYPAIR as KeyUsage[],
    privateKeyUsage: KEY_USAGES.AT_BINDING.PRIVATE_KEY as KeyUsage[]
};

const RT_BINDING_KEY_OPTIONS = {
    keyGenAlgorithmOptions: {
        name: BROWSER_CRYPTO.RSA_OAEP,
        hash: {
            name:  BROWSER_CRYPTO.S256_HASH_ALG
        },
        modulusLength: BROWSER_CRYPTO.MODULUS_LENGTH,
        publicExponent: PUBLIC_EXPONENT
    },
    keypairUsages: KEY_USAGES.RT_BINDING.KEYPAIR as KeyUsage[],
    privateKeyUsage: KEY_USAGES.RT_BINDING.PRIVATE_KEY as KeyUsage[]
};

describe("CryptoOps.ts Unit Tests", () => {
    let cryptoObj: CryptoOps;
    let dbStorage = {};
    beforeEach(() => {
        sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
            dbStorage = {};
        });

        sinon.stub(DatabaseStorage.prototype, "put").callsFake(async (key: string, payload: CachedKeyPair): Promise<void> => {
            dbStorage[key] = payload;
        });
        cryptoObj = new CryptoOps();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("createNewGuid()", () => {
        expect(GuidGenerator.isGuid(cryptoObj.createNewGuid())).to.be.true;
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
        expect(cryptoObj.base64Encode("")).to.be.empty;
        expect(cryptoObj.base64Encode("f")).to.be.eq("Zg==");
        expect(cryptoObj.base64Encode("fo")).to.be.eq("Zm8=");
        expect(cryptoObj.base64Encode("foo")).to.be.eq("Zm9v");
        expect(cryptoObj.base64Encode("foob")).to.be.eq("Zm9vYg==");
        expect(cryptoObj.base64Encode("fooba")).to.be.eq("Zm9vYmE=");
        expect(cryptoObj.base64Encode("foobar")).to.be.eq("Zm9vYmFy");
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
        expect(cryptoObj.base64Decode("")).to.be.empty;
        expect(cryptoObj.base64Decode("Zg==")).to.be.eq("f");
        expect(cryptoObj.base64Decode("Zm8=")).to.be.eq("fo");
        expect(cryptoObj.base64Decode("Zm9v")).to.be.eq("foo");
        expect(cryptoObj.base64Decode("Zm9vYg==")).to.be.eq("foob");
        expect(cryptoObj.base64Decode("Zm9vYmE=")).to.be.eq("fooba");
        expect(cryptoObj.base64Decode("Zm9vYmFy")).to.be.eq("foobar");
    });

    it("generatePkceCode() creates a valid Pkce code", async () => {
        sinon.stub(BrowserCrypto.prototype, <any>"getSubtleCryptoDigest").callsFake(async (algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).to.be.eq("SHA-256");
            return crypto.createHash("SHA256").update(Buffer.from(data)).digest();
        });

        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const generatedCodes: PkceCodes = await cryptoObj.generatePkceCodes();
        expect(regExp.test(generatedCodes.challenge)).to.be.true;
        expect(regExp.test(generatedCodes.verifier)).to.be.true;
    });

    it("getPublicKeyThumbprint() generates a valid req_cnf thumbprint", async () => {
        sinon.stub(BrowserCrypto.prototype, <any>"getSubtleCryptoDigest").callsFake(async (algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).to.be.eq("SHA-256");
            return crypto.createHash("SHA256").update(Buffer.from(data)).digest();
        });
        const generateKeyPairSpy = sinon.spy(BrowserCrypto.prototype, "generateKeyPair");
        const exportJwkSpy = sinon.spy(BrowserCrypto.prototype, "exportJwk");

        const keyType = "req_cnf";

        const testRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            authenticationScheme: AuthenticationScheme.POP,
            resourceRequestMethod:"POST",
            resourceRequestUrl: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
            stkJwk: TEST_POP_VALUES.KID
        };
        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint(testRequest, keyType);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        expect(generateKeyPairSpy.calledWith(AT_BINDING_KEY_OPTIONS, true));
        expect(generateKeyPairSpy.getCall(0).args[0].keyGenAlgorithmOptions.name.toLowerCase()).to.eq(AT_BINDING_KEY_OPTIONS.keyGenAlgorithmOptions.name.toLowerCase());
        expect(exportJwkSpy.calledWith((await generateKeyPairSpy.returnValues[0]).publicKey));
        expect(regExp.test(pkThumbprint)).to.be.true;
        expect(dbStorage[pkThumbprint]).to.be.not.empty;
    }).timeout(0);

    it("getPublicKeyThumbprint() generates a valid stk_jwk thumbprint", async () => {
        sinon.stub(BrowserCrypto.prototype, <any>"getSubtleCryptoDigest").callsFake(async (algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).to.be.eq("SHA-256");
            return crypto.createHash("SHA256").update(Buffer.from(data)).digest();
        });
        const generateKeyPairSpy = sinon.spy(BrowserCrypto.prototype, "generateKeyPair");
        const exportJwkSpy = sinon.spy(BrowserCrypto.prototype, "exportJwk");

        const keyType = "stk_jwk";

        const testRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            stkJwk: TEST_POP_VALUES.KID
        };
        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint(testRequest, keyType);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        expect(generateKeyPairSpy.calledWith(AT_BINDING_KEY_OPTIONS, true));
        expect(generateKeyPairSpy.getCall(0).args[0].keyGenAlgorithmOptions.name).to.eq(RT_BINDING_KEY_OPTIONS.keyGenAlgorithmOptions.name);
        expect(exportJwkSpy.calledWith((await generateKeyPairSpy.returnValues[0]).publicKey));
        expect(regExp.test(pkThumbprint)).to.be.true;
        expect(dbStorage[pkThumbprint]).to.be.not.empty;
    }).timeout(0);
});
