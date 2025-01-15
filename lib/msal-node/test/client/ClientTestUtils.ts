/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    ThrottlingConstants,
    ServerTelemetryEntity,
    CacheManager,
    ClientConfiguration,
    Constants,
    PkceCodes,
    AccountEntity,
    AppMetadataEntity,
    ThrottlingEntity,
    IdTokenEntity,
    AccessTokenEntity,
    RefreshTokenEntity,
    ProtocolMode,
    AuthorityOptions,
    AuthorityMetadataEntity,
    Logger,
    LogLevel,
    TokenKeys,
    createClientAuthError,
    ClientAuthErrorCodes,
    CacheHelpers,
    Authority,
    INetworkModule,
    ClientAssertionCallback,
    ClientAssertionConfig,
    PasswordGrantConstants,
} from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT,
    DEVICE_CODE_RESPONSE,
    ID_TOKEN_CLAIMS,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_CRYPTO_VALUES,
    TEST_DATA_CLIENT_INFO,
    TEST_POP_VALUES,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";
import { Configuration } from "../../src/config/Configuration.js";
import { TEST_CONSTANTS } from "../utils/TestConstants.js";

const ACCOUNT_KEYS = "ACCOUNT_KEYS";
const TOKEN_KEYS = "TOKEN_KEYS";

export class MockStorageClass extends CacheManager {
    store = {};

    // Accounts
    getAccount(key: string): AccountEntity | null {
        const account: AccountEntity = this.store[key] as AccountEntity;
        if (AccountEntity.isAccountEntity(account)) {
            return account;
        }
        return null;
    }

    getCachedAccountEntity(accountKey: string): AccountEntity | null {
        return this.getAccount(accountKey);
    }

    async setAccount(value: AccountEntity): Promise<void> {
        const key = value.generateAccountKey();
        this.store[key] = value;

        const currentAccounts = this.getAccountKeys();
        if (!currentAccounts.includes(key)) {
            currentAccounts.push(key);
            this.store[ACCOUNT_KEYS] = currentAccounts;
        }
    }

    async removeAccount(key: string): Promise<void> {
        await super.removeAccount(key);
        const currentAccounts = this.getAccountKeys();
        const removalIndex = currentAccounts.indexOf(key);
        if (removalIndex > -1) {
            currentAccounts.splice(removalIndex, 1);
            this.store[ACCOUNT_KEYS] = currentAccounts;
        }
    }

    getAccountKeys(): string[] {
        return this.store[ACCOUNT_KEYS] || [];
    }

    getTokenKeys(): TokenKeys {
        return (
            this.store[TOKEN_KEYS] || {
                idToken: [],
                accessToken: [],
                refreshToken: [],
            }
        );
    }

    // Credentials (idtokens)
    getIdTokenCredential(key: string): IdTokenEntity | null {
        return (this.store[key] as IdTokenEntity) || null;
    }
    async setIdTokenCredential(value: IdTokenEntity): Promise<void> {
        const key = CacheHelpers.generateCredentialKey(value);
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.idToken.includes(key)) {
            tokenKeys.idToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // Credentials (accesstokens)
    getAccessTokenCredential(key: string): AccessTokenEntity | null {
        return (this.store[key] as AccessTokenEntity) || null;
    }
    async setAccessTokenCredential(value: AccessTokenEntity): Promise<void> {
        const key = CacheHelpers.generateCredentialKey(value);
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.accessToken.includes(key)) {
            tokenKeys.accessToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // Credentials (accesstokens)
    getRefreshTokenCredential(key: string): RefreshTokenEntity | null {
        return (this.store[key] as RefreshTokenEntity) || null;
    }
    async setRefreshTokenCredential(value: RefreshTokenEntity): Promise<void> {
        const key = CacheHelpers.generateCredentialKey(value);
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.refreshToken.includes(key)) {
            tokenKeys.refreshToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // AppMetadata
    getAppMetadata(key: string): AppMetadataEntity | null {
        return this.store[key] as AppMetadataEntity;
    }
    setAppMetadata(value: AppMetadataEntity): void {
        const key = CacheHelpers.generateAppMetadataKey(value);
        this.store[key] = value;
    }

    // Telemetry cache
    getServerTelemetry(key: string): ServerTelemetryEntity | null {
        return this.store[key] as ServerTelemetryEntity;
    }
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void {
        this.store[key] = value;
    }

    // Authority Metadata Cache
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        return this.store[key] as AuthorityMetadataEntity;
    }
    setAuthorityMetadata(key: string, value: AuthorityMetadataEntity): void {
        this.store[key] = value;
    }

    // Throttling cache
    getThrottlingCache(key: string): ThrottlingEntity | null {
        return this.store[key] as ThrottlingEntity;
    }
    setThrottlingCache(key: string, value: ThrottlingEntity): void {
        this.store[key] = value;
    }

    removeItem(key: string): void {
        if (!!this.store[key]) {
            delete this.store[key];
        }
    }
    containsKey(key: string): boolean {
        return !!this.store[key];
    }
    getKeys(): string[] {
        return Object.keys(this.store);
    }
    getAuthorityMetadataKeys(): string[] {
        return this.getKeys();
    }
    async clear(): Promise<void> {
        this.store = {};
    }
}

export const mockCrypto = {
    createNewGuid(): string {
        return RANDOM_TEST_GUID;
    },
    base64Decode(input: string): string {
        if (AUTHENTICATION_RESULT.body.id_token.includes(input)) {
            return JSON.stringify(ID_TOKEN_CLAIMS);
        }
        switch (input) {
            case TEST_POP_VALUES.ENCODED_REQ_CNF:
                return TEST_POP_VALUES.DECODED_REQ_CNF;
            case TEST_TOKENS.POP_TOKEN_PAYLOAD:
                return TEST_TOKENS.DECODED_POP_TOKEN_PAYLOAD;
            case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            default:
                return input;
        }
    },
    base64Encode(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.DECODED_REQ_CNF:
                return TEST_POP_VALUES.ENCODED_REQ_CNF;
            default:
                return input;
        }
    },
    base64UrlEncode(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.DECODED_REQ_CNF:
                return TEST_POP_VALUES.URLSAFE_ENCODED_REQCNF;
            default:
                return input;
        }
    },
    encodeKid(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.KID:
                return TEST_POP_VALUES.URLSAFE_ENCODED_REQCNF;
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
    async removeTokenBindingKey(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async signJwt(): Promise<string> {
        return "";
    },
    async clearKeystore(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async hashString(): Promise<string> {
        return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
    },
};

export class ClientTestUtils {
    static async createTestClientConfiguration(
        clientCapabilities?: Array<string>,
        mockNetworkClient?: INetworkModule
    ): Promise<ClientConfiguration> {
        const mockStorage = new MockStorageClass(
            TEST_CONFIG.MSAL_CLIENT_ID,
            mockCrypto,
            new Logger({})
        );

        const testLoggerCallback = (): void => {
            return;
        };

        const mockHttpClient = mockNetworkClient || {
            sendGetRequestAsync<T>(): T {
                return {} as T;
            },
            sendPostRequestAsync<T>(): T {
                return {} as T;
            },
        };

        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [TEST_CONFIG.validAuthority],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };

        const loggerOptions = {
            loggerCallback: (): void => {},
            piiLoggingEnabled: true,
            logLevel: LogLevel.Verbose,
        };
        const logger = new Logger(loggerOptions);

        const authority = new Authority(
            TEST_CONFIG.validAuthority,
            mockHttpClient,
            mockStorage,
            authorityOptions,
            logger,
            TEST_CONFIG.CORRELATION_ID
        );

        await authority.resolveEndpointsAsync().catch(() => {
            throw createClientAuthError(
                ClientAuthErrorCodes.endpointResolutionError
            );
        });

        const clientConfig: ClientConfiguration = {
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: authority,
                redirectUri: TEST_CONFIG.REDIRECT_URI,
            },
            storageInterface: mockStorage,
            networkInterface: mockHttpClient,
            cryptoInterface: mockCrypto,
            loggerOptions: {
                loggerCallback: testLoggerCallback,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds:
                    TEST_CONFIG.DEFAULT_TOKEN_RENEWAL_OFFSET,
            },
            clientCredentials: {
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
            },
            libraryInfo: {
                sku: Constants.SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU,
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion,
                },
            },
        };

        if (clientCapabilities) {
            clientConfig.authOptions.clientCapabilities = clientCapabilities;
        }

        return clientConfig;
    }

    static async createTestConfidentialClientConfiguration(
        clientCapabilities?: Array<string>,
        mockNetworkClient?: INetworkModule
    ): Promise<Configuration> {
        const mockHttpClient = mockNetworkClient || {
            sendGetRequestAsync<T>(): T {
                return {} as T;
            },
            sendPostRequestAsync<T>(): T {
                return {} as T;
            },
        };

        const loggerOptions = {
            loggerCallback: (): void => {},
            piiLoggingEnabled: true,
            logLevel: LogLevel.Verbose,
        };

        const confidentialClientConfig: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
                // clientSecret, clientAssertion
                clientCertificate: {
                    // defaults to SHA-256 when both thumbprints are provided
                    thumbprint: TEST_CONSTANTS.THUMBPRINT,
                    thumbprintSha256: TEST_CONSTANTS.THUMBPRINT256,
                    privateKey: TEST_CONSTANTS.PRIVATE_KEY,
                },
                knownAuthorities: [TEST_CONSTANTS.AUTHORITY],
                cloudDiscoveryMetadata: "",
                authorityMetadata: "",
                clientCapabilities,
                protocolMode: ProtocolMode.AAD,
            },
            // broker, cache
            system: {
                loggerOptions,
                networkClient: mockHttpClient,
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion,
                },
            },
        };

        return confidentialClientConfig;
    }
}

interface checks {
    dstsScope?: boolean;
    graphScope?: boolean;
    clientId?: boolean;
    grantType?: string;
    clientSecret?: boolean;
    clientSku?: boolean;
    clientVersion?: boolean;
    clientOs?: boolean;
    clientCpu?: boolean;
    appName?: boolean;
    appVersion?: boolean;
    msLibraryCapability?: boolean;
    claims?: boolean;
    testConfigAssertion?: boolean;
    testRequestAssertion?: boolean;
    testAssertionType?: boolean;
    responseType?: boolean;
    username?: string;
    password?: string;
    deviceCode?: boolean;
    queryString?: boolean;
}

export const checkMockedNetworkRequest = (
    returnVal: string,
    checks: checks
): void => {
    if (checks.dstsScope !== undefined) {
        expect(
            returnVal.includes(
                encodeURIComponent(TEST_CONFIG.DSTS_TEST_SCOPE[0])
            )
        ).toBe(checks.dstsScope);
    }

    if (checks.graphScope !== undefined) {
        expect(
            returnVal.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)
        ).toBe(checks.graphScope);
    }

    if (checks.clientId !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
            )
        ).toBe(checks.clientId);
    }

    if (checks.grantType) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.GRANT_TYPE}=${checks.grantType}`
            )
        ).toBe(true);
    }

    if (checks.clientSecret !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
            )
        ).toBe(checks.clientSecret);
    }

    if (checks.clientSku !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
            )
        ).toBe(checks.clientSku);
    }

    if (checks.clientVersion !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
            )
        ).toBe(checks.clientVersion);
    }

    if (checks.clientOs !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
            )
        ).toBe(checks.clientOs);
    }

    if (checks.clientCpu !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
            )
        ).toBe(checks.clientCpu);
    }

    if (checks.appName !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
            )
        ).toBe(checks.appName);
    }

    if (checks.appVersion !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
            )
        ).toBe(checks.appVersion);
    }

    if (checks.msLibraryCapability !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
            )
        ).toBe(checks.msLibraryCapability);
    }

    if (checks.claims !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                    TEST_CONFIG.CLAIMS
                )}`
            )
        ).toBe(checks.claims);
    }

    if (checks.testConfigAssertion !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent(
                    TEST_CONFIG.TEST_CONFIG_ASSERTION
                )}`
            )
        ).toBe(checks.testConfigAssertion);
    }

    if (checks.testRequestAssertion !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent(
                    TEST_CONFIG.TEST_REQUEST_ASSERTION
                )}`
            )
        ).toBe(checks.testRequestAssertion);
    }

    if (checks.testAssertionType !== undefined) {
        expect(
            returnVal.includes(
                `${
                    AADServerParamKeys.CLIENT_ASSERTION_TYPE
                }=${encodeURIComponent(TEST_CONFIG.TEST_ASSERTION_TYPE)}`
            )
        ).toBe(checks.testAssertionType);
    }

    if (checks.responseType !== undefined) {
        expect(
            returnVal.includes(
                `${AADServerParamKeys.RESPONSE_TYPE}=${Constants.TOKEN_RESPONSE_TYPE}%20${Constants.ID_TOKEN_RESPONSE_TYPE}`
            )
        ).toBe(checks.responseType);
    }

    if (checks.username) {
        expect(
            returnVal.includes(
                `${PasswordGrantConstants.username}=${checks.username}`
            )
        ).toBe(true);
    }

    if (checks.password) {
        expect(
            returnVal.includes(
                `${PasswordGrantConstants.password}=${checks.password}`
            )
        ).toBe(true);
    }

    if (checks.deviceCode) {
        expect(returnVal.includes(DEVICE_CODE_RESPONSE.deviceCode)).toBe(true);
    }

    if (checks.queryString) {
        expect(
            returnVal.includes(
                `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
            )
        ).toBe(true);
    }
};

export const getClientAssertionCallback = (
    clientAssertion: string
): ClientAssertionCallback => {
    const clientAssertionCallback: ClientAssertionCallback = async (
        _config: ClientAssertionConfig
    ): Promise<string> => {
        return Promise.resolve(clientAssertion);
    };

    return clientAssertionCallback;
};
