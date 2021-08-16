/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult } from "@azure/msal-browser";

export const TEST_CONFIG = {
    MSAL_CLIENT_ID: "0813e1d1-ad72-46a9-8665-399bba48c201",
};

export const TEST_DATA_CLIENT_INFO = {
    TEST_UID: "123-test-uid",
    TEST_UID_ENCODED: "MTIzLXRlc3QtdWlk",
    TEST_UTID: "456-test-utid",
    TEST_UTID_ENCODED: "NDU2LXRlc3QtdXRpZA==",
    TEST_UTID_URLENCODED: "NDU2LXRlc3QtdXRpZA",
    TEST_DECODED_CLIENT_INFO: "{\"uid\":\"123-test-uid\",\"utid\":\"456-test-utid\"}",
    TEST_INVALID_JSON_CLIENT_INFO: "{\"uid\":\"123-test-uid\"\"utid\":\"456-test-utid\"}",
    TEST_RAW_CLIENT_INFO: "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9",
    TEST_CLIENT_INFO_B64ENCODED: "eyJ1aWQiOiIxMjM0NSIsInV0aWQiOiI2Nzg5MCJ9",
    TEST_HOME_ACCOUNT_ID: "MTIzLXRlc3QtdWlk.NDU2LXRlc3QtdXRpZA=="
};

export const testAccount: AccountInfo = {
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED,
    environment: "login.windows.net",
    tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
    username: "example@microsoft.com",
    name: "Abe Lincoln"
};

export const testResult: AuthenticationResult = {
    authority: "https://login.microsoftonline.com",
    uniqueId: "unique-id",
    tenantId: "tenant-id",
    scopes: ["openid", "profile"],
    idToken: "test-id-token",
    idTokenClaims: {},
    accessToken: "test-access-token",
    fromCache: false,
    correlationId: "test-correlation-id",
    expiresOn: new Date(Date.now() + (3600000)),
    account: testAccount,
    tokenType: "Bearer"
};
