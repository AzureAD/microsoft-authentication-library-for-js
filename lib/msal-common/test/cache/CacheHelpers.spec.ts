import { expect } from "chai";
import { CacheHelpers } from "../../src/cache/CacheHelpers";
import { TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_TOKENS, TEST_CONFIG, TEST_URIS, TEST_TOKEN_LIFETIMES } from "../utils/StringConstants";
import sinon from "sinon";
import { ICacheStorage } from "../../src/cache/ICacheStorage";
import { Constants } from "../../src/utils/Constants";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { buildClientInfo, ClientInfo } from "../../src/account/ClientInfo";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { AccessTokenKey } from "../../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../../src/cache/AccessTokenValue";
import { AccessTokenCacheItem } from "../../src/cache/AccessTokenCacheItem";


describe("CacheHelpers.ts Tests", () => {

    let store = {};
    let cacheStorageMock: ICacheStorage = {
        setItem(key: string, value: string): void {
            store[key] = value;
        },
        getItem(key: string): string {
            return store[key];
        },
        removeItem(key: string): boolean {
            delete store[key];
            return true;
        },
        containsKey(key: string): boolean {
            return !!store[key];
        },
        getKeys(): string[] {
            return Object.keys(store);
        },
        clear(): void {
            store = {};
        },
        getCache(): object {
            return null;
        },
        setCache(): void {
            return null;
        },
    };

    describe("Constructors", () => {

        beforeEach(() => {
            store = {};
        });

        it("Creates a CacheHelpers class instance", () => {
            const cacheStorage: ICacheStorage = cacheStorageMock;
            const cacheHelpers = new CacheHelpers(cacheStorage);
            expect(cacheHelpers instanceof CacheHelpers).to.be.true;
        });
    });

    describe("Generator functions", () => {

        let cacheHelpers: CacheHelpers;
        beforeEach(() => {
            const cacheStorage: ICacheStorage = cacheStorageMock;
            cacheHelpers = new CacheHelpers(cacheStorage);
        });

        afterEach(() => {
            store = {};
        });


    });

    describe("Cache Setters", () => {

        let cacheHelpers: CacheHelpers;
        let cryptoInterface: ICrypto;
        let idToken: IdToken;
        let clientInfo: ClientInfo;
        beforeEach(() => {
            const cacheStorage: ICacheStorage = cacheStorageMock;
            cacheHelpers = new CacheHelpers(cacheStorage);

            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                            return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                        default:
                            return input;
                    }
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
        });

        afterEach(() => {
            store = {};
            sinon.restore();
        });
    });

    describe("Token handling functions", () => {

        let cacheHelpers: CacheHelpers;
        let cryptoInterface: ICrypto;
        let cacheStorage: ICacheStorage;
        let scopeString: string;
        let testResource: string;
        let testResource2: string;
        let testHomeAccId2: string;
        beforeEach(() => {
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    return input;
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
            scopeString = TEST_CONFIG.DEFAULT_SCOPES.join(" ");
            testResource = "https://login.contoso.com/endpt";
            testResource2 = "https://login.contoso.com/endpt2";
            const cacheStorage: ICacheStorage = cacheStorageMock;

            cacheHelpers = new CacheHelpers(cacheStorage);
            const atKey1 = new AccessTokenKey(
				Constants.DEFAULT_AUTHORITY,
				TEST_CONFIG.MSAL_CLIENT_ID,
				scopeString,
				TEST_DATA_CLIENT_INFO.TEST_UID,
				TEST_DATA_CLIENT_INFO.TEST_UTID,
				cryptoInterface
			);
            const atValue1: AccessTokenValue = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                expiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP}`,
                extExpiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
            };
            cacheStorage.setItem(JSON.stringify(atKey1), JSON.stringify(atValue1));

            const atValue2: AccessTokenValue = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V1,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                expiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP}`,
                extExpiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
            };

            testHomeAccId2 = "testHomeAccountId";
            const atKey2: AccessTokenKey = {
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scopes: scopeString,
                homeAccountIdentifier: testHomeAccId2
            };
            const atKey3: AccessTokenKey = {
                authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common/`,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scopes: scopeString,
                homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
            };

            cacheStorage.setItem(JSON.stringify(atKey2), JSON.stringify(atValue1));
            cacheStorage.setItem(JSON.stringify(atKey3), JSON.stringify(atValue2));

            const atKey4: AccessTokenKey = {
                authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common/`,
                clientId: RANDOM_TEST_GUID,
                scopes: scopeString,
                homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
            };

			cacheStorage.setItem(JSON.stringify(atKey4), JSON.stringify(atValue1));
        });

        afterEach(() => {
            store = {};
            sinon.restore();
        });

        it("getAllAccessTokens() correctly gets all access tokens matching the given variables", () => {
            const atArr1: Array<AccessTokenCacheItem> = cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`);
            const atArr2: Array<AccessTokenCacheItem> = cacheHelpers.getAllAccessTokens(RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`);
            const atArr3: Array<AccessTokenCacheItem> = cacheHelpers.getAllAccessTokens(RANDOM_TEST_GUID, `${TEST_URIS.ALTERNATE_INSTANCE}/common/`);
            const atArr4: Array<AccessTokenCacheItem> = cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${TEST_URIS.ALTERNATE_INSTANCE}/common/`);
            const atArr5: Array<AccessTokenCacheItem> = cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            const atArr6: Array<AccessTokenCacheItem> = cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, testHomeAccId2);

            expect(atArr1.length).to.be.eq(2);
            expect(atArr2.length).to.be.eq(0);
            expect(atArr3.length).to.be.eq(1);
            expect(atArr4.length).to.be.eq(1);
            expect(atArr5.length).to.be.eq(1);
            expect(atArr6.length).to.be.eq(1);
        });

        it("removeAllAccessTokens() correctly removes all access tokens matching client id and authority", () => {
            expect(cacheStorage.getKeys().length).to.be.eq(4);
            cacheHelpers.removeAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`);
            expect(cacheStorage.getKeys().length).to.be.eq(2);
        });

        it("removeAllAccessTokens() correctly removes all access tokens matching client id, authority, resource and home account identifier", () => {
            expect(cacheStorage.getKeys().length).to.be.eq(4);
            cacheHelpers.removeAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(cacheStorage.getKeys().length).to.be.eq(3);
        });
    });
});
