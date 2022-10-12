import { AccountEntity } from "../../../src/cache/entities/AccountEntity";
import { mockAccountEntity, mockIdTokenEntity } from "./cacheConstants";
import { AuthToken } from "../../../src/account/AuthToken";
import { AuthorityFactory } from "../../../src/authority/AuthorityFactory";
import { CacheAccountType, Constants } from "../../../src/utils/Constants";
import { NetworkRequestOptions, INetworkModule } from "../../../src/network/INetworkModule";
import { ICrypto, PkceCodes } from "../../../src/crypto/ICrypto";
import { RANDOM_TEST_GUID, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_TOKENS, TEST_URIS, TEST_POP_VALUES, PREFERRED_CACHE_ALIAS, TEST_CRYPTO_VALUES } from "../../test_kit/StringConstants";
import sinon from "sinon";
import { MockStorageClass, mockCrypto } from "../../client/ClientTestUtils";
import { AccountInfo } from "../../../src/account/AccountInfo";
import { AuthorityOptions } from "../../../src/authority/AuthorityOptions";
import { ProtocolMode } from "../../../src/authority/ProtocolMode";
import { LogLevel, Logger } from "../../../src/logger/Logger";
import { Authority } from "../../../src/authority/Authority";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src/error/ClientAuthError";
import { AuthorityType } from "../../../src/authority/AuthorityType";

const cryptoInterface: ICrypto = {
    createNewGuid(): string {
        return RANDOM_TEST_GUID;
    },
    base64Decode(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.ENCODED_REQ_CNF:
                return TEST_POP_VALUES.DECODED_REQ_CNF;
            case TEST_DATA_CLIENT_INFO.TEST_CACHE_RAW_CLIENT_INFO:
                return TEST_DATA_CLIENT_INFO.TEST_CACHE_DECODED_CLIENT_INFO;
            case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS:
                return TEST_DATA_CLIENT_INFO.TEST_CACHE_DECODED_CLIENT_INFO_GUIDS
            default:
                return input;
        }
    },
    base64Encode(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.DECODED_REQ_CNF:
                return TEST_POP_VALUES.ENCODED_REQ_CNF;
            case "uid":
                return "dWlk";
            case "utid":
                return "dXRpZA==";
            default:
                return input;
        }
    },
    async generatePkceCodes(): Promise<PkceCodes> {
        return {
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER,
        };
    },
    async getPublicKeyThumbprint(): Promise<string> {
        return TEST_POP_VALUES.KID;
    },
    async signJwt(): Promise<string> {
        return "";
    },
    async removeTokenBindingKey(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async clearKeystore(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async hashString(): Promise<string> {
        return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
    }
};

const networkInterface: INetworkModule = {
    sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): T {
        return {} as T;
    }
};

const authorityOptions: AuthorityOptions = {
    protocolMode: ProtocolMode.AAD,
    knownAuthorities: [Constants.DEFAULT_AUTHORITY],
    cloudDiscoveryMetadata: "",
    authorityMetadata: ""
}
const authority =  AuthorityFactory.createInstance(
    Constants.DEFAULT_AUTHORITY,
    networkInterface,
    new MockStorageClass("client-id", mockCrypto),
    authorityOptions
);

const loggerOptions = {
    loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
        console.log(`Log level: ${level} Message: ${message}`);
    },
    piiLoggingEnabled: true,
    logLevel: LogLevel.Verbose
};

describe("AccountEntity.ts Unit Tests", () => {
    beforeEach(() => {
        sinon.stub(Authority.prototype, "getPreferredCache").returns("login.windows.net");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("Verify an AccountEntity", () => {
        const ac = new AccountEntity();
        expect(ac instanceof AccountEntity);
    });

    it("generate an AccountEntityKey", () => {
        const ac = new AccountEntity();
        Object.assign(ac, mockAccountEntity);
        expect(ac.generateAccountKey()).toEqual("uid.utid-login.microsoftonline.com-microsoft");
    });

    it("throws error if account entity is not assigned a type", () => {
        const ac = new AccountEntity();
        expect(() => ac.generateType()).toThrowError(ClientAuthError);
        expect(() => ac.generateType()).toThrowError(ClientAuthErrorMessage.unexpectedAccountType.desc);
    });

    it("generate type of the cache", () => {
        const ac = new AccountEntity();
        Object.assign(ac, mockAccountEntity);
        expect(ac.generateType()).toEqual(1003);
    });

    it("create an Account", () => {
        // Set up stubs
        const idTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "preferred_username": "AbeLi@microsoft.com",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
        const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const logger = new Logger(loggerOptions);
        const homeAccountId = AccountEntity.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            idToken);

        const acc = AccountEntity.createAccount(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            homeAccountId,
            idToken,
            authority
        );

        expect(acc.generateAccountKey()).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("AbeLi@microsoft.com");
        expect(acc.localAccountId).toEqual(idTokenClaims.oid);
        expect(acc.idTokenClaims).toBe(idTokenClaims);
    });

    it("create an Account with sub instead of oid as localAccountId", () => {
        // Set up stubs
        const idTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "preferred_username": "AbeLi@microsoft.com",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
        const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const logger = new Logger(loggerOptions);
        const homeAccountId = AccountEntity.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            idToken);

        const acc = AccountEntity.createAccount(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            homeAccountId,
            idToken,
            authority
        );

        expect(acc.generateAccountKey()).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("AbeLi@microsoft.com");
        expect(acc.localAccountId).toEqual(idTokenClaims.sub);
        expect(acc.idTokenClaims).toBe(idTokenClaims);
    });

    it("create an Account with emails claim instead of preferred_username claim", () => {
        // Set up stubs
        const idTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "emails": ["AbeLi@microsoft.com"],
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
		const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const logger = new Logger(loggerOptions);
        const homeAccountId = AccountEntity.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            idToken);

        const acc = AccountEntity.createAccount(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            homeAccountId,
            idToken,
            authority
        );
        expect(acc.generateAccountKey()).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("AbeLi@microsoft.com");
        expect(acc.localAccountId).toEqual(idTokenClaims.oid);
        expect(acc.idTokenClaims).toBe(idTokenClaims);
    });

    it("create an Account no preferred_username or emails claim", () => {
        const authority =  AuthorityFactory.createInstance(
            Constants.DEFAULT_AUTHORITY,
            networkInterface,
            new MockStorageClass("client-id", mockCrypto),
            authorityOptions
		);

        // Set up stubs
        const idTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
		const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const logger = new Logger(loggerOptions);
        const homeAccountId = AccountEntity.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            idToken);

        const acc = AccountEntity.createAccount(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            homeAccountId,
            idToken,
            authority
        );

        expect(acc.generateAccountKey()).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("");
        expect(acc.localAccountId).toEqual(idTokenClaims.oid);
        expect(acc.idTokenClaims).toBe(idTokenClaims);
    });

    it("creates a generic account", () => {
        const authority =  AuthorityFactory.createInstance(
            Constants.DEFAULT_AUTHORITY,
            networkInterface,
            new MockStorageClass("client-id", mockCrypto),
            {
                protocolMode: ProtocolMode.OIDC,
                knownAuthorities: [Constants.DEFAULT_AUTHORITY],
                cloudDiscoveryMetadata: "",
                authorityMetadata: ""
            }
		);

        // Set up stubs
        const idTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
            "upn": "testupn"
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
		const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const homeAccountId = "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ".toLowerCase();
        const acc = AccountEntity.createGenericAccount(
            homeAccountId,
            idToken,
            authority
        );

        expect(acc.generateAccountKey()).toEqual(`${idTokenClaims.sub.toLowerCase()}-login.windows.net-`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(""); // Realm empty for generic accounts
        expect(acc.username).toBe("testupn");
        expect(acc.localAccountId).toBe(idTokenClaims.oid);
        expect(acc.authorityType).toBe(CacheAccountType.GENERIC_ACCOUNT_TYPE);
        expect(AccountEntity.isAccountEntity(acc)).toEqual(true);
        expect(acc.idTokenClaims).toBe(idTokenClaims);
    });

    it("verify if an object is an account entity", () => {
        expect(AccountEntity.isAccountEntity(mockAccountEntity)).toEqual(true);
    });

    it("verify if an object is not an account entity", () => {
        expect(AccountEntity.isAccountEntity(mockIdTokenEntity)).toEqual(false);
    });

    describe("accountInfoIsEqual()", () => {
        let acc: AccountEntity;
        beforeEach(() => {
            // Set up stubs
            const idTokenClaims = {
                "ver": "2.0",
                "iat": 1536361411,
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": 1536361411,
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

            const logger = new Logger(loggerOptions);
            const homeAccountId = AccountEntity.generateHomeAccountId(
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
                AuthorityType.Default,
                logger,
                cryptoInterface,
                idToken);

            acc = AccountEntity.createAccount(
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
                homeAccountId,
                idToken,
                authority
            );
        })

        it("returns true if two account info objects have the same values", () => {
            const acc1: AccountInfo = acc.getAccountInfo();
            const acc2: AccountInfo = {...acc1};
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, false)).toBe(true);  
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, true)).toBe(true);            
        });

        it("returns false if two account info objects represent the same user but have different iat claims", () => {
            const acc1: AccountInfo = acc.getAccountInfo();
            const acc2: AccountInfo = {
                username: acc1.username,
                homeAccountId: acc1.homeAccountId,
                localAccountId: acc1.localAccountId,
                environment: acc1.environment,
                tenantId: acc1.tenantId,
                idTokenClaims: {
                    ...acc1.idTokenClaims,
                    iat: 100,
                }
            };
            const acc3: AccountInfo = {
                username: acc1.username,
                homeAccountId: acc1.homeAccountId,
                localAccountId: acc1.localAccountId,
                environment: acc1.environment,
                tenantId: acc1.tenantId,
                idTokenClaims: {
                    ...acc1.idTokenClaims,
                    iat: undefined,
                }
            };

            // iat claims are different
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, false)).toBe(true);  
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, true)).toBe(false);    
            
            // iat claim is missing on 1 account
            expect(AccountEntity.accountInfoIsEqual(acc1, acc3, false)).toBe(true);  
            expect(AccountEntity.accountInfoIsEqual(acc1, acc3, true)).toBe(false); 
        });

        it("returns false if two account info objects represent the same user but have different nonce claims", () => {
            const acc1: AccountInfo = acc.getAccountInfo();
            const acc2: AccountInfo = {
                username: acc1.username,
                homeAccountId: acc1.homeAccountId,
                localAccountId: acc1.localAccountId,
                environment: acc1.environment,
                tenantId: acc1.tenantId,
                idTokenClaims: {
                    ...acc1.idTokenClaims,
                    nonce: "56789",
                }
            };
            const acc3: AccountInfo = {
                username: acc1.username,
                homeAccountId: acc1.homeAccountId,
                localAccountId: acc1.localAccountId,
                environment: acc1.environment,
                tenantId: acc1.tenantId,
                idTokenClaims: {
                    ...acc1.idTokenClaims,
                    nonce: undefined,
                }
            };

            // nonce claims are different
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, false)).toBe(true);  
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, true)).toBe(false);    
            
            // nonce claim is missing on 1 account
            expect(AccountEntity.accountInfoIsEqual(acc1, acc3, false)).toBe(true);  
            expect(AccountEntity.accountInfoIsEqual(acc1, acc3, true)).toBe(false); 
        });
    
        it("returns false if required AccountInfo parameters are not equal", () => {
            const acc1: AccountInfo = acc.getAccountInfo();
            const acc2: AccountInfo = {...acc1};
            const acc3: AccountInfo = {...acc1};
            const acc4: AccountInfo = {...acc1};
            const acc5: AccountInfo = {...acc1};
            const acc6: AccountInfo = {...acc1};
            const acc7: AccountInfo = {...acc1};
            const acc8: AccountInfo = {...acc1};
            acc2.homeAccountId = "mockHomeAccountId2";
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, false)).toBe(false);
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2, true)).toBe(false);
            acc3.localAccountId = "mockLocalAccountId2";
            expect(AccountEntity.accountInfoIsEqual(acc1, acc3, false)).toBe(false);
            expect(AccountEntity.accountInfoIsEqual(acc1, acc3, true)).toBe(false);
            acc4.environment = "mockEnv2";
            expect(AccountEntity.accountInfoIsEqual(acc1, acc4, false)).toBe(false);
            expect(AccountEntity.accountInfoIsEqual(acc1, acc4, true)).toBe(false);
            acc5.tenantId = "mockTenant2";
            expect(AccountEntity.accountInfoIsEqual(acc1, acc5, false)).toBe(false);
            expect(AccountEntity.accountInfoIsEqual(acc1, acc5, true)).toBe(false);
            acc6.username = "mockUsername2";
            expect(AccountEntity.accountInfoIsEqual(acc1, acc6, false)).toBe(false);
            expect(AccountEntity.accountInfoIsEqual(acc1, acc6, true)).toBe(false);
            acc7.name = "mockName2";
            expect(AccountEntity.accountInfoIsEqual(acc1, acc7, false)).toBe(true);
            expect(AccountEntity.accountInfoIsEqual(acc1, acc7, true)).toBe(true);
            acc8.idTokenClaims = {};
            expect(AccountEntity.accountInfoIsEqual(acc1, acc8, false)).toBe(true);
            expect(AccountEntity.accountInfoIsEqual(acc1, acc8, true)).toBe(false);
        });

        it("returns false if an account info object is invalid", () => {
            const acc1 = null;
            const acc2: AccountInfo = acc.getAccountInfo();
            expect(AccountEntity.accountInfoIsEqual(acc1, acc2)).toBe(false);

            const acc3: AccountInfo = acc.getAccountInfo();
            const acc4 = null;
            expect(AccountEntity.accountInfoIsEqual(acc3, acc4)).toBe(false); 
            
            const acc5 = null;
            const acc6 = null;
            expect(AccountEntity.accountInfoIsEqual(acc5, acc6)).toBe(false); 
        });
    });
});

describe("AccountEntity.ts Unit Tests for ADFS", () => {
    beforeEach(() => {
        sinon.stub(Authority.prototype, "getPreferredCache").returns("myadfs.com");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("creates a generic ADFS account", () => {
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.OIDC,
            knownAuthorities: ["myadfs.com"],
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        }
        const authority = AuthorityFactory.createInstance(
            "https://myadfs.com/adfs",
            networkInterface,
            new MockStorageClass("client-id", mockCrypto), 
            authorityOptions
        );

        // Set up stubs
        const idTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
            "upn": "testupn"
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
        const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const homeAccountId = "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ".toLowerCase();
        const acc = AccountEntity.createGenericAccount(
            homeAccountId,
            idToken,
            authority
        );

        expect(acc.generateAccountKey()).toEqual(`${idTokenClaims.sub.toLowerCase()}-myadfs.com-`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe("myadfs.com");
        expect(acc.realm).toBe("");
        expect(acc.username).toBe("testupn");
        expect(acc.localAccountId).toBe(idTokenClaims.oid);
        expect(acc.authorityType).toBe(CacheAccountType.ADFS_ACCOUNT_TYPE);
        expect(AccountEntity.isAccountEntity(acc)).toEqual(true);
        expect(acc.idTokenClaims).toBe(idTokenClaims);
    });

    it("creates a generic ADFS account without OID", () => {
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.OIDC,
            knownAuthorities: ["myadfs.com"],
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        }
        const authority = AuthorityFactory.createInstance(
            "https://myadfs.com/adfs",
            networkInterface,
            new MockStorageClass("client-id", mockCrypto), 
            authorityOptions
        );

        // Set up stubs
        const idTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
            "upn": "testupn"
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
        const idToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const homeAccountId = "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ".toLowerCase();
        const acc = AccountEntity.createGenericAccount(
            homeAccountId,
            idToken,
            authority
        );

        expect(acc.generateAccountKey()).toEqual(`${idTokenClaims.sub.toLowerCase()}-myadfs.com-`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe("myadfs.com");
        expect(acc.realm).toBe("");
        expect(acc.username).toBe("testupn");
        expect(acc.authorityType).toBe(CacheAccountType.ADFS_ACCOUNT_TYPE);
        expect(acc.localAccountId).toBe(idTokenClaims.sub);
        expect(AccountEntity.isAccountEntity(acc)).toEqual(true);
        expect(acc.idTokenClaims).toBe(idTokenClaims);
    });
});
