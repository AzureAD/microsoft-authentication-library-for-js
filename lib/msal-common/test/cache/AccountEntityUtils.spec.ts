import {
    mockAccountEntity,
    mockIdTokenEntity,
} from "./entities/cacheConstants.js";
import * as AuthToken from "../../src/account/AuthToken.js";
import {
    CACHE_ACCOUNT_TYPE_ADFS,
    CACHE_ACCOUNT_TYPE_GENERIC,
    DEFAULT_AUTHORITY,
} from "../../src/utils/Constants.js";
import {
    NetworkRequestOptions,
    INetworkModule,
} from "../../src/network/INetworkModule.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import {
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
    TEST_URIS,
    PREFERRED_CACHE_ALIAS,
    ID_TOKEN_CLAIMS,
    GUEST_ID_TOKEN_CLAIMS,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import {
    MockStorageClass,
    generateAccountKey,
    mockCrypto,
} from "../client/ClientTestUtils.js";
import { TenantProfile } from "../../src/account/AccountInfo.js";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";
import { LogLevel, Logger } from "../../src/logger/Logger.js";
import { Authority } from "../../src/authority/Authority.js";
import { AuthorityType } from "../../src/authority/AuthorityType.js";
import * as AccountEntityUtils from "../../src/cache/utils/AccountEntityUtils.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";

const cryptoInterface: ICrypto = mockCrypto;

const networkInterface: INetworkModule = {
    sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    },
};

const authorityOptions: AuthorityOptions = {
    protocolMode: ProtocolMode.AAD,
    knownAuthorities: [DEFAULT_AUTHORITY],
    cloudDiscoveryMetadata: "",
    authorityMetadata: "",
};

const loggerOptions = {
    loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
    ): void => {
        console.log(`Log level: ${level} Message: ${message}`);
    },
    piiLoggingEnabled: true,
    logLevel: LogLevel.Verbose,
};
const logger = new Logger(loggerOptions);
const performanceClient = new StubPerformanceClient();

const authority = new Authority(
    DEFAULT_AUTHORITY,
    networkInterface,
    new MockStorageClass("client-id", mockCrypto, logger, performanceClient),
    authorityOptions,
    logger,
    TEST_CONFIG.CORRELATION_ID,
    new StubPerformanceClient()
);

describe("AccountEntityUtils.ts Unit Tests", () => {
    beforeEach(() => {
        jest.spyOn(Authority.prototype, "getPreferredCache").mockReturnValue(
            "login.windows.net"
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("generate an AccountEntityKey", () => {
        expect(
            generateAccountKey(
                AccountEntityUtils.getAccountInfo(mockAccountEntity)
            )
        ).toEqual("uid.utid-login.microsoftonline.com-utid");
    });

    it("uses the subject claim when a default authority omits client info", () => {
        const warningSpy = jest.spyOn(logger, "warning");
        const subject = "subject-id";

        const homeAccountId = AccountEntityUtils.generateHomeAccountId(
            "",
            AuthorityType.Default,
            logger,
            cryptoInterface,
            TEST_CONFIG.CORRELATION_ID,
            { sub: subject }
        );

        expect(homeAccountId).toBe(subject);
        expect(warningSpy).toHaveBeenCalledWith(
            "No client info in response",
            TEST_CONFIG.CORRELATION_ID
        );
    });

    it("create an Account", () => {
        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            preferred_username: "AbeLi@microsoft.com",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        };

        const homeAccountId = AccountEntityUtils.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            TEST_CONFIG.CORRELATION_ID,
            idTokenClaims
        );

        const acc = AccountEntityUtils.createAccountEntity(
            {
                homeAccountId,
                idTokenClaims: idTokenClaims,
            },
            authority,
            ""
        );

        expect(
            generateAccountKey(AccountEntityUtils.getAccountInfo(acc))
        ).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("AbeLi@microsoft.com");
        expect(acc.localAccountId).toEqual(idTokenClaims.oid);
    });

    it("create an Account with sub instead of oid as localAccountId", () => {
        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            preferred_username: "AbeLi@microsoft.com",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        };

        const homeAccountId = AccountEntityUtils.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            TEST_CONFIG.CORRELATION_ID,
            idTokenClaims
        );

        const acc = AccountEntityUtils.createAccountEntity(
            {
                homeAccountId,
                idTokenClaims: idTokenClaims,
            },
            authority,
            ""
        );

        expect(
            generateAccountKey(AccountEntityUtils.getAccountInfo(acc))
        ).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("AbeLi@microsoft.com");
        expect(acc.localAccountId).toEqual(idTokenClaims.sub);
    });

    it("create an Account with emails claim instead of preferred_username claim", () => {
        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            emails: ["AbeLi@microsoft.com"],
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        };
        const homeAccountId = AccountEntityUtils.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            TEST_CONFIG.CORRELATION_ID,
            idTokenClaims
        );

        const acc = AccountEntityUtils.createAccountEntity(
            {
                homeAccountId,
                idTokenClaims: idTokenClaims,
            },
            authority,
            ""
        );
        expect(
            generateAccountKey(AccountEntityUtils.getAccountInfo(acc))
        ).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("AbeLi@microsoft.com");
        expect(acc.localAccountId).toEqual(idTokenClaims.oid);
    });

    it("create an Account no preferred_username or emails claim", () => {
        const authority = new Authority(
            DEFAULT_AUTHORITY,
            networkInterface,
            new MockStorageClass(
                "client-id",
                mockCrypto,
                logger,
                performanceClient
            ),
            authorityOptions,
            logger,
            TEST_CONFIG.CORRELATION_ID,
            new StubPerformanceClient()
        );

        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        };

        const homeAccountId = AccountEntityUtils.generateHomeAccountId(
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
            AuthorityType.Default,
            logger,
            cryptoInterface,
            TEST_CONFIG.CORRELATION_ID,
            idTokenClaims
        );

        const acc = AccountEntityUtils.createAccountEntity(
            {
                homeAccountId,
                idTokenClaims: idTokenClaims,
            },
            authority,
            ""
        );

        expect(
            generateAccountKey(AccountEntityUtils.getAccountInfo(acc))
        ).toEqual(`${homeAccountId}-login.windows.net-${idTokenClaims.tid}`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(idTokenClaims.tid);
        expect(acc.username).toBe("");
        expect(acc.localAccountId).toEqual(idTokenClaims.oid);
    });

    it("creates a generic account", () => {
        const authority = new Authority(
            DEFAULT_AUTHORITY,
            networkInterface,
            new MockStorageClass(
                "client-id",
                mockCrypto,
                logger,
                performanceClient
            ),
            {
                protocolMode: ProtocolMode.OIDC,
                knownAuthorities: [DEFAULT_AUTHORITY],
                cloudDiscoveryMetadata: "",
                authorityMetadata: "",
            },
            logger,
            TEST_CONFIG.CORRELATION_ID,
            new StubPerformanceClient()
        );

        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            nonce: "123523",
            upn: "testupn",
        };
        jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
            idTokenClaims
        );

        const homeAccountId =
            "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ".toLowerCase();
        const acc = AccountEntityUtils.createAccountEntity(
            {
                homeAccountId,
                idTokenClaims: AuthToken.extractTokenClaims(
                    TEST_TOKENS.IDTOKEN_V2,
                    cryptoInterface.base64Decode,
                    ""
                ),
            },
            authority,
            ""
        );

        expect(
            generateAccountKey(AccountEntityUtils.getAccountInfo(acc))
        ).toEqual(`${idTokenClaims.sub.toLowerCase()}-login.windows.net-`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe(PREFERRED_CACHE_ALIAS);
        expect(acc.realm).toBe(""); // Realm empty for generic accounts
        expect(acc.username).toBe("testupn");
        expect(acc.localAccountId).toBe(idTokenClaims.oid);
        expect(acc.authorityType).toBe(CACHE_ACCOUNT_TYPE_GENERIC);
        expect(AccountEntityUtils.isAccountEntity(acc)).toEqual(true);
    });

    it("verify if an object is an account entity", () => {
        expect(AccountEntityUtils.isAccountEntity(mockAccountEntity)).toEqual(
            true
        );
    });

    it("verify if an object is not an account entity", () => {
        expect(AccountEntityUtils.isAccountEntity(mockIdTokenEntity)).toEqual(
            false
        );
    });

    it("getAccountInfo correctly deserializes tenantProfiles in an account entity", () => {
        const accountEntity = buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS, [
            GUEST_ID_TOKEN_CLAIMS,
        ]);

        const tenantProfiles = new Map<string, TenantProfile>();

        accountEntity.tenantProfiles?.forEach((tenantProfile) => {
            tenantProfiles.set(tenantProfile.tenantId, tenantProfile);
        });

        const accountInfo = AccountEntityUtils.getAccountInfo(accountEntity);
        expect(accountInfo.tenantProfiles).toBeDefined();
        expect(accountInfo.tenantProfiles?.size).toBe(2);
        expect(accountInfo.tenantProfiles).toMatchObject(tenantProfiles);
    });

    it("getAccountInfo creates home tenant profile if AccountEntity does not have a tenantProfiles array", () => {
        const accountEntity = buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        accountEntity.tenantProfiles = undefined;

        const accountInfo = AccountEntityUtils.getAccountInfo(accountEntity);
        expect(accountInfo.tenantProfiles).toBeDefined();
        // Should create the home tenant profile from realm and localAccountId
        expect(accountInfo.tenantProfiles?.size).toBe(1);
        expect(accountInfo.tenantProfiles?.has(accountEntity.realm)).toBe(true);
        const homeTenantProfile = accountInfo.tenantProfiles?.get(
            accountEntity.realm
        );
        expect(homeTenantProfile?.tenantId).toBe(accountEntity.realm);
        expect(homeTenantProfile?.localAccountId).toBe(
            accountEntity.localAccountId
        );
        expect(homeTenantProfile?.isHomeTenant).toBe(true);
    });

    it("isSingleTenant returns true if AccountEntity does not have a tenantProfiles array", () => {
        const accountEntity = buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        accountEntity.tenantProfiles = undefined;

        expect(AccountEntityUtils.isSingleTenant(accountEntity)).toBe(true);
    });

    it("isSingleTenant returns false if AccountEntity has a tenantProfiles array", () => {
        const accountEntity = buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

        expect(AccountEntityUtils.isSingleTenant(accountEntity)).toBe(false);
    });

    describe("AccountEntity createAccount with dataBoundary", () => {
        it("creates an account with dataBoundary from clientInfo.xms_tdbr", () => {
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };

            // Create client info with xms_tdbr
            const clientInfoWithDataBoundary = {
                uid: "00000000-0000-0000-66f3-3332eca7ea81",
                utid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                xms_tdbr: "EU",
            };
            const encodedClientInfo = cryptoInterface.base64Encode(
                JSON.stringify(clientInfoWithDataBoundary)
            );

            const homeAccountId = AccountEntityUtils.generateHomeAccountId(
                encodedClientInfo,
                AuthorityType.Default,
                logger,
                cryptoInterface,
                TEST_CONFIG.CORRELATION_ID,
                idTokenClaims
            );

            const acc = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: idTokenClaims,
                    clientInfo: encodedClientInfo,
                },
                authority,
                "",
                cryptoInterface.base64Decode
            );

            expect(acc.dataBoundary).toBe("EU");
        });

        it("creates an account without dataBoundary when clientInfo has no xms_tdbr", () => {
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };

            const homeAccountId = AccountEntityUtils.generateHomeAccountId(
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
                AuthorityType.Default,
                logger,
                cryptoInterface,
                TEST_CONFIG.CORRELATION_ID,
                idTokenClaims
            );

            const acc = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: idTokenClaims,
                    clientInfo:
                        TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
                },
                authority,
                "",
                cryptoInterface.base64Decode
            );

            expect(acc.dataBoundary).toBeUndefined();
        });

        it("creates an account without dataBoundary when no clientInfo is provided", () => {
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };

            const homeAccountId = AccountEntityUtils.generateHomeAccountId(
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO_GUIDS,
                AuthorityType.Default,
                logger,
                cryptoInterface,
                TEST_CONFIG.CORRELATION_ID,
                idTokenClaims
            );

            const acc = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: idTokenClaims,
                },
                authority,
                "",
                cryptoInterface.base64Decode
            );

            expect(acc.dataBoundary).toBeUndefined();
        });

        it("handles empty string xms_tdbr gracefully", () => {
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };

            // Create client info with empty xms_tdbr
            const clientInfoWithEmptyDataBoundary = {
                uid: "00000000-0000-0000-66f3-3332eca7ea81",
                utid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                xms_tdbr: "",
            };
            const encodedClientInfo = cryptoInterface.base64Encode(
                JSON.stringify(clientInfoWithEmptyDataBoundary)
            );

            const homeAccountId = AccountEntityUtils.generateHomeAccountId(
                encodedClientInfo,
                AuthorityType.Default,
                logger,
                cryptoInterface,
                TEST_CONFIG.CORRELATION_ID,
                idTokenClaims
            );

            const acc = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: idTokenClaims,
                    clientInfo: encodedClientInfo,
                },
                authority,
                "",
                cryptoInterface.base64Decode
            );

            expect(acc.dataBoundary).toBeUndefined();
        });

        it("handles null xms_tdbr gracefully", () => {
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };

            // Create client info with null xms_tdbr
            const clientInfoWithNullDataBoundary = {
                uid: "00000000-0000-0000-66f3-3332eca7ea81",
                utid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                xms_tdbr: null,
            };
            const encodedClientInfo = cryptoInterface.base64Encode(
                JSON.stringify(clientInfoWithNullDataBoundary)
            );

            const homeAccountId = AccountEntityUtils.generateHomeAccountId(
                encodedClientInfo,
                AuthorityType.Default,
                logger,
                cryptoInterface,
                TEST_CONFIG.CORRELATION_ID,
                idTokenClaims
            );

            const acc = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: idTokenClaims,
                    clientInfo: encodedClientInfo,
                },
                authority,
                "",
                cryptoInterface.base64Decode
            );

            expect(acc.dataBoundary).toBeUndefined();
        });
    });
});

describe("AccountEntityUtils.ts Unit Tests for ADFS", () => {
    beforeEach(() => {
        jest.spyOn(Authority.prototype, "getPreferredCache").mockReturnValue(
            "myadfs.com"
        );
    });

    it("creates a generic ADFS account", () => {
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.OIDC,
            knownAuthorities: ["myadfs.com"],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
        const authority = new Authority(
            "https://myadfs.com/adfs",
            networkInterface,
            new MockStorageClass(
                "client-id",
                mockCrypto,
                logger,
                performanceClient
            ),
            authorityOptions,
            logger,
            TEST_CONFIG.CORRELATION_ID,
            new StubPerformanceClient()
        );

        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            nonce: "123523",
            upn: "testupn",
        };
        jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
            idTokenClaims
        );

        const homeAccountId =
            "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ".toLowerCase();
        const acc = AccountEntityUtils.createAccountEntity(
            {
                homeAccountId,
                idTokenClaims: AuthToken.extractTokenClaims(
                    TEST_TOKENS.IDTOKEN_V2,
                    cryptoInterface.base64Decode,
                    ""
                ),
            },
            authority,
            ""
        );

        expect(
            generateAccountKey(AccountEntityUtils.getAccountInfo(acc))
        ).toEqual(`${idTokenClaims.sub.toLowerCase()}-myadfs.com-`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe("myadfs.com");
        expect(acc.realm).toBe("");
        expect(acc.username).toBe("testupn");
        expect(acc.localAccountId).toBe(idTokenClaims.oid);
        expect(acc.authorityType).toBe(CACHE_ACCOUNT_TYPE_ADFS);
        expect(AccountEntityUtils.isAccountEntity(acc)).toEqual(true);
    });

    it("creates a generic ADFS account without OID", () => {
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.OIDC,
            knownAuthorities: ["myadfs.com"],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
        const authority = new Authority(
            "https://myadfs.com/adfs",
            networkInterface,
            new MockStorageClass(
                "client-id",
                mockCrypto,
                logger,
                performanceClient
            ),
            authorityOptions,
            logger,
            TEST_CONFIG.CORRELATION_ID,
            new StubPerformanceClient()
        );

        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            nonce: "123523",
            upn: "testupn",
        };
        jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
            idTokenClaims
        );

        const homeAccountId =
            "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ".toLowerCase();
        const acc = AccountEntityUtils.createAccountEntity(
            {
                homeAccountId,
                idTokenClaims: AuthToken.extractTokenClaims(
                    TEST_TOKENS.IDTOKEN_V2,
                    cryptoInterface.base64Decode,
                    ""
                ),
            },
            authority,
            ""
        );

        expect(
            generateAccountKey(AccountEntityUtils.getAccountInfo(acc))
        ).toEqual(`${idTokenClaims.sub.toLowerCase()}-myadfs.com-`);
        expect(acc.homeAccountId).toBe(homeAccountId);
        expect(acc.environment).toBe("myadfs.com");
        expect(acc.realm).toBe("");
        expect(acc.username).toBe("testupn");
        expect(acc.authorityType).toBe(CACHE_ACCOUNT_TYPE_ADFS);
        expect(acc.localAccountId).toBe(idTokenClaims.sub);
        expect(AccountEntityUtils.isAccountEntity(acc)).toEqual(true);
    });
});
