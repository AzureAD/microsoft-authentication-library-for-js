/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthError,
    AuthError,
    ServerError,
    ICrypto,
    InteractionRequiredAuthError,
    AuthenticationResult,
    Logger,
    ClientAuthErrorCodes,
    AccountInfo as MsalAccountInfo,
} from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { NestedAppAuthAdapter } from "../../src/naa/mapping/NestedAppAuthAdapter.js";
import {
    BRIDGE_ERROR_ACCOUNT_UNAVAILABLE,
    BRIDGE_ERROR_DISABLED,
    BRIDGE_ERROR_NAA_UNAVAILABLE,
    BRIDGE_ERROR_NOT_NETWORK,
    BRIDGE_ERROR_PERSISTENT_ERROR_SERVER,
    BRIDGE_ERROR_TRANSIENT_ERROR_SERVER,
    BRIDGE_ERROR_USER_CANCEL,
    BRIDGE_ERROR_USER_INTERACTION_REQUIRED,
    SILENT_TOKEN_RESPONSE,
    SILENT_TOKEN_REQUEST,
    POPUP_REQUEST,
    NAA_CLIENT_ID,
    NAA_CLIENT_CAPABILITIES,
    NAA_SCOPE,
    REDIRECT_REQUEST,
} from "./BridgeProxyConstants.js";
import { TokenRequest } from "../../src/naa/TokenRequest.js";
import { AccountInfo as NaaAccountInfo } from "../../src/naa/AccountInfo.js";

describe("NestedAppAuthAdapter tests", () => {
    let nestedAppAuthAdapter: NestedAppAuthAdapter;
    beforeEach(() => {
        // All logger options properties are optional... so passing empty object
        const logger = new Logger({});
        const crypto: ICrypto = new CryptoOps(logger);
        nestedAppAuthAdapter = new NestedAppAuthAdapter(
            NAA_CLIENT_ID,
            NAA_CLIENT_CAPABILITIES,
            crypto,
            logger
        );
    });

    describe("to TokenRequest tests", () => {
        it("PopupRequest to TokenRequest", () => {
            const result: TokenRequest =
                nestedAppAuthAdapter.toNaaTokenRequest(POPUP_REQUEST);
            expect(result.clientId).toBe(NAA_CLIENT_ID);
            expect(result.correlationId).toBe(
                SILENT_TOKEN_REQUEST.correlationId
            );
            expect(result.scope).toBe(NAA_SCOPE);
        });

        it("RedirectRequest to TokenRequest", () => {
            const result: TokenRequest =
                nestedAppAuthAdapter.toNaaTokenRequest(REDIRECT_REQUEST);
            expect(result.clientId).toBe(NAA_CLIENT_ID);
            expect(result.correlationId).toBe(
                SILENT_TOKEN_REQUEST.correlationId
            );
            expect(result.scope).toBe(NAA_SCOPE);
        });
    });

    describe("to AuthenticationResult from TokenResponse tests", () => {
        it("TokenResponse to AuthenticationResult", () => {
            const result: AuthenticationResult =
                nestedAppAuthAdapter.fromNaaTokenResponse(
                    SILENT_TOKEN_REQUEST,
                    SILENT_TOKEN_RESPONSE,
                    0
                );
            expect(result.authority).toBe(
                SILENT_TOKEN_RESPONSE.account.environment
            );
            expect(result.uniqueId).toBe(
                SILENT_TOKEN_RESPONSE.account.localAccountId
            );
            expect(result.tenantId).toBe(
                SILENT_TOKEN_RESPONSE.account.tenantId
            );
            expect(result.accessToken).toBe(
                SILENT_TOKEN_RESPONSE.token.access_token
            );
            expect(result.account?.environment).toBe(
                SILENT_TOKEN_RESPONSE.account.environment
            );
            expect(result.account?.homeAccountId).toBe(
                SILENT_TOKEN_RESPONSE.account.homeAccountId
            );
            expect(result.account?.localAccountId).toBe(
                SILENT_TOKEN_RESPONSE.account.localAccountId
            );
            expect(result.account?.name).toBe(
                SILENT_TOKEN_RESPONSE.account.name
            );
        });
    });

    describe("to MSAL.js Error from BridgeError tests", () => {
        // No Network
        it("no network bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_NOT_NETWORK
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(
                ClientAuthErrorCodes.noNetworkConnectivity
            );
        });

        // Disabled
        it("disabled bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_DISABLED
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(
                ClientAuthErrorCodes.nestedAppAuthBridgeDisabled
            );
        });

        // Account Unavailable
        it("account unavailable bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_ACCOUNT_UNAVAILABLE
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(ClientAuthErrorCodes.noAccountFound);
        });

        // Nested App Auth Unavailable
        it("nested app auth bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_NAA_UNAVAILABLE
            );
            expect(error instanceof ClientAuthError).toBe(true);
        });

        // User Cancelled
        it("user cancelled bridge error to ClientAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_USER_CANCEL
            );
            expect(error instanceof ClientAuthError).toBe(true);
            expect(error.errorCode).toBe(ClientAuthErrorCodes.userCanceled);
        });

        // Transient
        it("transient bridge error to ServerAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER
            );
            expect(error instanceof ServerError).toBe(true);
            expect(error.errorCode).toBe(
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER.code
            );
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_TRANSIENT_ERROR_SERVER.description
            );
        });

        // Persistent
        it("persistent bridge error to ServerAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER
            );
            expect(error instanceof ServerError).toBe(true);
            expect(error.errorCode).toBe(
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER.code
            );
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_PERSISTENT_ERROR_SERVER.description
            );
        });

        // InteractionRequired
        it("interaction required bridge error to InteractionRequiredAuthError", () => {
            const error = nestedAppAuthAdapter.fromBridgeError(
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED
            );
            expect(error instanceof InteractionRequiredAuthError).toBe(true);
            expect(error.errorCode).toBe(
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED.code
            );
            expect(error.errorMessage).toBe(
                BRIDGE_ERROR_USER_INTERACTION_REQUIRED.description
            );
        });

        // Some other error
        it("all other errors return AuthError", () => {
            const bridgeError = new Error("unknown");
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const error = nestedAppAuthAdapter.fromBridgeError(bridgeError);
            expect(error instanceof AuthError).toBe(true);
            expect(error.errorCode).toBe("unknown_error");
            expect(error.errorMessage).toBe("An unknown error occurred");
        });
    });

    describe("fromNaaAccountInfo tests", () => {
        const TEST_OID = "test-oid-12345";
        const TEST_SUB = "test-sub-67890";
        const TEST_TID = "test-tenant-id";
        const TEST_TFP = "B2C_1_signupsignin"; // B2C modern policy
        const TEST_ACR = "b2c_1_legacy"; // B2C legacy policy
        const TEST_ENVIRONMENT = "login.microsoftonline.com";
        const TEST_USERNAME = "testuser@contoso.com";
        const TEST_PREFERRED_USERNAME = "preferred@contoso.com";
        const TEST_UPN = "upn@contoso.com";
        const TEST_EMAIL = "email@contoso.com";
        const TEST_NAME = "Test User";
        const TEST_LOGIN_HINT = "test-login-hint";
        const TEST_ID_TOKEN = "mock.id.token";

        // Helper to create minimal account with just required fields
        const createMinimalAccount = (
            overrides: Partial<NaaAccountInfo> = {}
        ): NaaAccountInfo => ({
            environment: TEST_ENVIRONMENT,
            username: TEST_USERNAME,
            ...overrides,
        });

        // Helper to create base idTokenClaims
        const createBaseClaims = (
            overrides: Record<string, unknown> = {}
        ): Record<string, unknown> => ({
            oid: TEST_OID,
            tid: TEST_TID,
            ...overrides,
        });

        describe("response validation", () => {
            describe("basic field mapping", () => {
                it("should map all fields from NaaAccountInfo when provided", () => {
                    const naaAccount: NaaAccountInfo = {
                        homeAccountId: `${TEST_OID}.${TEST_TID}`,
                        environment: TEST_ENVIRONMENT,
                        tenantId: TEST_TID,
                        username: TEST_USERNAME,
                        localAccountId: TEST_OID,
                        name: TEST_NAME,
                        loginHint: TEST_LOGIN_HINT,
                    };

                    const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                        naaAccount,
                        TEST_ID_TOKEN
                    );

                    expect(result.homeAccountId).toBe(
                        `${TEST_OID}.${TEST_TID}`
                    );
                    expect(result.environment).toBe(TEST_ENVIRONMENT);
                    expect(result.tenantId).toBe(TEST_TID);
                    expect(result.username).toBe(TEST_USERNAME);
                    expect(result.localAccountId).toBe(TEST_OID);
                    expect(result.name).toBe(TEST_NAME);
                    expect(result.loginHint).toBe(TEST_LOGIN_HINT);
                    expect(result.idToken).toBe(TEST_ID_TOKEN);
                });

                it("should create tenantProfile for the account", () => {
                    const naaAccount: NaaAccountInfo = {
                        homeAccountId: `${TEST_OID}.${TEST_TID}`,
                        environment: TEST_ENVIRONMENT,
                        tenantId: TEST_TID,
                        username: TEST_USERNAME,
                        localAccountId: TEST_OID,
                    };

                    const result =
                        nestedAppAuthAdapter.fromNaaAccountInfo(naaAccount);

                    expect(result.tenantProfiles).toBeDefined();
                    expect(result.tenantProfiles?.size).toBe(1);
                    expect(result.tenantProfiles?.has(TEST_TID)).toBe(true);
                    const tenantProfile = result.tenantProfiles?.get(TEST_TID);
                    expect(tenantProfile?.tenantId).toBe(TEST_TID);
                    expect(tenantProfile?.localAccountId).toBe(TEST_OID);
                });
            });

            describe("fallback to idTokenClaims", () => {
                it.each([
                    ["oid", { oid: TEST_OID, tid: TEST_TID }, TEST_OID],
                    ["sub (when oid missing)", { sub: TEST_SUB, tid: TEST_TID }, TEST_SUB],
                ])(
                    "should derive localAccountId from %s claim",
                    (_desc, claims, expected) => {
                        const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                            createMinimalAccount(),
                            TEST_ID_TOKEN,
                            claims
                        );
                        expect(result.localAccountId).toBe(expected);
                    }
                );

                it("should derive tenantId from tid claim when not in account", () => {
                    const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                        createMinimalAccount(),
                        TEST_ID_TOKEN,
                        createBaseClaims()
                    );
                    expect(result.tenantId).toBe(TEST_TID);
                });

                it("should compute homeAccountId from localAccountId and tenantId when not provided", () => {
                    const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                        createMinimalAccount(),
                        TEST_ID_TOKEN,
                        createBaseClaims()
                    );
                    expect(result.homeAccountId).toBe(`${TEST_OID}.${TEST_TID}`);
                });

                it.each([
                    ["name", { name: TEST_NAME }, "name", TEST_NAME],
                    ["loginHint", { login_hint: TEST_LOGIN_HINT }, "loginHint", TEST_LOGIN_HINT],
                ])(
                    "should derive %s from idTokenClaims when not in account",
                    (_field, extraClaims, resultField, expected) => {
                        const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                            createMinimalAccount(),
                            TEST_ID_TOKEN,
                            createBaseClaims(extraClaims)
                        );
                        expect(
                            result[resultField as keyof typeof result]
                        ).toBe(expected);
                    }
                );

                it("should use idTokenClaims from account when not passed as parameter", () => {
                    const naaAccount = createMinimalAccount({
                        idTokenClaims: {
                            oid: TEST_OID,
                            tid: TEST_TID,
                            name: TEST_NAME,
                        },
                    });

                    const result =
                        nestedAppAuthAdapter.fromNaaAccountInfo(naaAccount);

                    expect(result.localAccountId).toBe(TEST_OID);
                    expect(result.tenantId).toBe(TEST_TID);
                    expect(result.name).toBe(TEST_NAME);
                });
            });

            describe("environment validation", () => {
                it("should throw ClientAuthError with invalidCacheEnvironment code when environment is empty", () => {
                    const naaAccount = createMinimalAccount({ environment: "" });

                    expect(() =>
                        nestedAppAuthAdapter.fromNaaAccountInfo(naaAccount)
                    ).toThrow(ClientAuthError);

                    try {
                        nestedAppAuthAdapter.fromNaaAccountInfo(naaAccount);
                        fail("Expected error to be thrown");
                    } catch (error) {
                        expect((error as ClientAuthError).errorCode).toBe(
                            ClientAuthErrorCodes.invalidCacheEnvironment
                        );
                    }
                });
            });

            describe("B2C scenarios", () => {
                it.each([
                    ["tfp (modern B2C)", { oid: TEST_OID, tfp: TEST_TFP }, TEST_TFP],
                    ["acr (legacy B2C)", { oid: TEST_OID, acr: TEST_ACR }, TEST_ACR],
                ])(
                    "should derive tenantId from %s claim",
                    (_desc, claims, expected) => {
                        const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                            createMinimalAccount(),
                            TEST_ID_TOKEN,
                            claims
                        );
                        expect(result.tenantId).toBe(expected);
                    }
                );

                it("should prefer tid over tfp and acr", () => {
                    const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                        createMinimalAccount(),
                        TEST_ID_TOKEN,
                        { oid: TEST_OID, tid: TEST_TID, tfp: TEST_TFP, acr: TEST_ACR }
                    );
                    expect(result.tenantId).toBe(TEST_TID);
                });

                it("should derive username from emails claim in B2C scenarios", () => {
                    const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                        createMinimalAccount({ username: "" }),
                        TEST_ID_TOKEN,
                        createBaseClaims({ emails: [TEST_EMAIL, "secondary@contoso.com"] })
                    );
                    expect(result.username).toBe(TEST_EMAIL);
                });
            });

            describe("username fallback chain", () => {
                it.each([
                    [
                        "account username over claims",
                        TEST_USERNAME,
                        { preferred_username: TEST_PREFERRED_USERNAME, upn: TEST_UPN, emails: [TEST_EMAIL] },
                        TEST_USERNAME,
                    ],
                    [
                        "preferred_username when account username is empty",
                        "",
                        { preferred_username: TEST_PREFERRED_USERNAME, upn: TEST_UPN, emails: [TEST_EMAIL] },
                        TEST_PREFERRED_USERNAME,
                    ],
                    [
                        "upn when preferred_username is not present",
                        "",
                        { upn: TEST_UPN, emails: [TEST_EMAIL] },
                        TEST_UPN,
                    ],
                    [
                        "emails[0] when preferred_username and upn are not present",
                        "",
                        { emails: [TEST_EMAIL] },
                        TEST_EMAIL,
                    ],
                    [
                        "empty string when no username sources are available",
                        "",
                        {},
                        "",
                    ],
                ])(
                    "should prefer %s",
                    (_desc, accountUsername, extraClaims, expected) => {
                        const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                            createMinimalAccount({ username: accountUsername }),
                            TEST_ID_TOKEN,
                            createBaseClaims(extraClaims)
                        );
                        expect(result.username).toBe(expected);
                    }
                );
            });

            describe("empty field fallbacks", () => {
                it.each([
                    [
                        "localAccountId",
                        { tid: TEST_TID },
                        "localAccountId",
                        "",
                    ],
                    [
                        "tenantId",
                        { oid: TEST_OID },
                        "tenantId",
                        "",
                    ],
                    [
                        "name",
                        { oid: TEST_OID, tid: TEST_TID },
                        "name",
                        "",
                    ],
                ])(
                    "should return empty string for %s when not derivable",
                    (_field, claims, resultField, expected) => {
                        const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                            createMinimalAccount(),
                            TEST_ID_TOKEN,
                            claims
                        );
                        expect(result[resultField as keyof typeof result]).toBe(
                            expected
                        );
                    }
                );

                it("should return undefined for loginHint when not derivable", () => {
                    const result = nestedAppAuthAdapter.fromNaaAccountInfo(
                        createMinimalAccount(),
                        TEST_ID_TOKEN,
                        createBaseClaims()
                    );
                    expect(result.loginHint).toBeUndefined();
                });
            });
        });
    });
});
