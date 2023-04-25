/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult } from "@azure/msal-common";
import { Account, ErrorStatus, MsalRuntimeError } from "@azure/msal-node-runtime";

export const testMsalRuntimeAccount: Account = {
    accountId: "MTIzLXRlc3QtdWlk.NDU2LXRlc3QtdXRpZA==",
    homeAccountId: "123-test-uid.456-test-utid",
    environment: "login.windows.net",
    realm: "456-test-utid",
    localAccountId: "123-test-uid",
    username: "JohnSmith@contoso.com",
    givenName: "John",
    familyName: "Smith",
    middleName: "M",
    displayName: "John Smith",
    additionalFieldsJson: "",
    homeEnvironment: "login.windows.net",
    clientInfo: "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9"
}

export const testAccountInfo: AccountInfo = {
    homeAccountId: testMsalRuntimeAccount.homeAccountId,
    environment: testMsalRuntimeAccount.environment,
    tenantId: testMsalRuntimeAccount.realm,
    username: testMsalRuntimeAccount.username,
    localAccountId: testMsalRuntimeAccount.localAccountId,
    idTokenClaims: undefined,
    name: testMsalRuntimeAccount.displayName,
    nativeAccountId: testMsalRuntimeAccount.accountId
};

export const msalRuntimeExampleError: MsalRuntimeError = {
    errorCode: 0,
    errorStatus: ErrorStatus.Unexpected,
    errorContext: "Test Error",
    errorTag: 0
};

export const TEST_CLIENT_ID = "0813e1d1-ad72-46a9-8665-399bba48c201";

export const TEST_ID_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw";

export const TEST_ID_TOKEN_CLAIMS = {
    ver: "2.0",
    iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
    sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
    aud: "6cb04018-a3f5-46a7-b995-940c78f5aef3",
    exp: 1536361411,
    iat: 1536274711,
    nbf: 1536274711,
    name: "Abe Lincoln",
    preferred_username: "AbeLi@microsoft.com",
    oid: "00000000-0000-0000-66f3-3332eca7ea81",
    tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
    nonce: "123523",
    aio: "Df2UVXL1ix!lMCWMSOJBcFatzcGfvFGhjKv8q5g0x732dR5MB5BisvGQO7YWByjd8iQDLq!eGbIDakyp5mnOrcdqHeYSnltepQmRp6AIZ8jY"
};

export const TEST_ACCESS_TOKEN = "this.is.an.accesstoken";

export const getTestAuthenticationResult = (correlationId: string): AuthenticationResult => {
    return {
        authority: "https://login.microsoftonline.com/common",
        uniqueId: TEST_ID_TOKEN_CLAIMS.oid,
        tenantId: TEST_ID_TOKEN_CLAIMS.tid,
        scopes: ["User.Read", "openid", "profile"],
        account: {...testAccountInfo,
                  idTokenClaims: TEST_ID_TOKEN_CLAIMS
                 },
        idToken: TEST_ID_TOKEN,
        idTokenClaims: TEST_ID_TOKEN_CLAIMS,
        accessToken: TEST_ACCESS_TOKEN,
        fromCache: false,
        expiresOn: new Date(Date.now() + 3600 * 1000),
        tokenType: "Bearer",
        correlationId,
        fromNativeBroker: true
    }
};

export const TEST_REDIRECTURI = "http://localhost";
