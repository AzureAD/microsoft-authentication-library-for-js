/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationScheme, Constants, NetworkResponse } from "@azure/msal-common";
import { version } from "../../src/packageMetadata";

/**
 * This file contains the string constants used by the test classes.
 */
export const NUM_TESTS = 100;
export const RANDOM_TEST_GUID = "11553a9b-7116-48b1-9d48-f6d4a8ff8371";

// Test URIs
export const TEST_URIS = {
    DEFAULT_INSTANCE: "https://login.microsoftonline.com/",
    ALTERNATE_INSTANCE: "https://login.windows.net/",
    TEST_REDIR_URI: "https://localhost:8081/index.html",
    TEST_REDIR_WITH_PERCENTENCODED_SYMBOLS_URI: "https://localhost:8081/%D1%80/index.html",
    TEST_ALTERNATE_REDIR_URI: "https://localhost:8081/index2.html",
    TEST_LOGOUT_URI: "https://localhost:8081/logout.html",
    TEST_AUTH_ENDPT: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    TEST_END_SESSION_ENDPOINT: "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
    TEST_AUTH_ENDPT_WITH_PARAMS: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?param1=value1&param2=value2",
    TEST_AZURE_CHINA_INSTANCE: "https://login.chinacloudapi.cn/",
    TEST_AZURE_GERMANY_INSTANCE: "https://login.microsoftonline.de/",
    TEST_AZURE_USGOV_INSTANCE: "https://login.microsoftonline.us/"
};

// Test MSAL config params
export const TEST_CONFIG = {
    TENANT: "common",
    MSAL_CLIENT_ID: "0813e1d1-ad72-46a9-8665-399bba48c201",
    MSAL_CLIENT_SECRET: "ThisIsASecret",
    MSAL_TENANT_ID: "3338040d-6c67-4c5b-b112-36a304b66dad",
    validAuthority: TEST_URIS.DEFAULT_INSTANCE + "common/",
    chinaAuthority: TEST_URIS.TEST_AZURE_CHINA_INSTANCE + "common/",
    germanyAuthority: TEST_URIS.TEST_AZURE_GERMANY_INSTANCE + "common/",
    usGovAuthority: TEST_URIS.TEST_AZURE_USGOV_INSTANCE + "common/",
    alternateValidAuthority: TEST_URIS.ALTERNATE_INSTANCE + "common/",
    ADFS_AUTHORITY: "https://authority.com/adfs",
    applicationName: "msal.js-tests",
    applicationVersion: "msal.js-tests.1.0.fake",
    STATE: "1234",
    TEST_VERIFIER: "Y5LnOOlAWK0kt370Bjm0ZcrW9Sc2pMXR1slip9TFZXoyUV8Y8lCn0WHXyyQ1QcTnALMbrUAj85dC7WIe6gYqc8o8jsHCezP3xiUNB143A5IfwtSfO6Kb8oy7pNqcT9vN",
    TEST_CHALLENGE: "JsjesZmxJwehdhNY9kvyr0QOeSMEvryY_EHZo3BKrqg",
    TOKEN_TYPE_BEARER: AuthenticationScheme.BEARER,
    TOKEN_TYPE_POP: AuthenticationScheme.POP,
    DEFAULT_SCOPES: ["openid", "profile"],
    CORRELATION_ID: RANDOM_TEST_GUID,
    SID: "session-id",
    OID: "test-oid",
    SUB: "test-sub",
    RESPONSE_MODE: "fragment",
    TOKEN_EXPIRY: 3600,
};

// Test Tokens
export const TEST_TOKENS = {
    /*
     * idTokens referenced from MSFT docs: https://docs.microsoft.com/en-us/azure/active-directory/develop/id-tokens
     * accessTokens referenced from MSFT docs: https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens
     */
    IDTOKEN_V1: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyIsImtpZCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyJ9.ewogICJhdWQiOiAiYjE0YTc1MDUtOTZlOS00OTI3LTkxZTgtMDYwMWQwZmM5Y2FhIiwKICAiaXNzIjogImh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2ZhMTVkNjkyLWU5YzctNDQ2MC1hNzQzLTI5ZjI5NTZmZDQyOS8iLAogICJpYXQiOiAxNTM2Mjc1MTI0LAogICJuYmYiOiAxNTM2Mjc1MTI0LAogICJleHAiOiAxNTM2Mjc5MDI0LAogICJhaW8iOiAiQVhRQWkvOElBQUFBcXhzdUIrUjREMnJGUXFPRVRPNFlkWGJMRDlrWjh4ZlhhZGVBTTBRMk5rTlQ1aXpmZzN1d2JXU1hodVNTajZVVDVoeTJENldxQXBCNWpLQTZaZ1o5ay9TVTI3dVY5Y2V0WGZMT3RwTnR0Z2s1RGNCdGsrTExzdHovSmcrZ1lSbXY5YlVVNFhscGhUYzZDODZKbWoxRkN3PT0iLAogICJhbXIiOiBbCiAgICAicnNhIgogIF0sCiAgImVtYWlsIjogImFiZWxpQG1pY3Jvc29mdC5jb20iLAogICJmYW1pbHlfbmFtZSI6ICJMaW5jb2xuIiwKICAiZ2l2ZW5fbmFtZSI6ICJBYmUiLAogICJpZHAiOiAiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3LyIsCiAgImlwYWRkciI6ICIxMzEuMTA3LjIyMi4yMiIsCiAgIm5hbWUiOiAiYWJlbGkiLAogICJub25jZSI6ICIxMjM1MjMiLAogICJvaWQiOiAiMDU4MzNiNmItYWExZC00MmQ0LTllYzAtMWIyYmI5MTk0NDM4IiwKICAicmgiOiAiSSIsCiAgInN1YiI6ICI1X0o5clNzczgtanZ0X0ljdTZ1ZVJOTDh4WGI4TEY0RnNnX0tvb0MyUkpRIiwKICAidGlkIjogImZhMTVkNjkyLWU5YzctNDQ2MC1hNzQzLTI5ZjI5NTZmZDQyOSIsCiAgInVuaXF1ZV9uYW1lIjogIkFiZUxpQG1pY3Jvc29mdC5jb20iLAogICJ1dGkiOiAiTHhlXzQ2R3FUa09wR1NmVGxuNEVBQSIsCiAgInZlciI6ICIxLjAiLAogICJ1cG4iOiAiQWJlTGluY29sbkBjb250b3NvLmNvbSIKfQ==.UJQrCA6qn2bXq57qzGX_-D3HcPHqBMOKDPx4su1yKRLNErVD8xkxJLNLVRdASHqEcpyDctbdHccu6DPpkq5f0ibcaQFhejQNcABidJCTz0Bb2AbdUCTqAzdt9pdgQvMBnVH1xk3SCM6d4BbT4BkLLj10ZLasX7vRknaSjE_C5DI7Fg4WrZPwOhII1dB0HEZ_qpNaYXEiy-o94UJ94zCr07GgrqMsfYQqFR7kn-mn68AjvLcgwSfZvyR_yIK75S_K37vC3QryQ7cNoafDe9upql_6pB2ybMVlgWPs_DmbJ8g0om-sPlwyn74Cc1tW3ze-Xptw_2uVdPgWyqfuWAfq6Q",
    IDTOKEN_V2: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
    IDTOKEN_V2_NEWCLAIM: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.ewogICJ2ZXIiOiAiMi4wIiwKICAiaXNzIjogImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS85MTg4MDQwZC02YzY3LTRjNWItYjExMi0zNmEzMDRiNjZkYWQvdjIuMCIsCiAgInN1YiI6ICJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwKICAiYXVkIjogIjZjYjA0MDE4LWEzZjUtNDZhNy1iOTk1LTk0MGM3OGY1YWVmMyIsCiAgImV4cCI6IDE1MzYzNjE0MTEsCiAgImlhdCI6IDE1MzYyNzQ3MTEsCiAgIm5iZiI6IDE1MzYyNzQ3MTEsCiAgIm5hbWUiOiAiQWJlIExpbmNvbG4iLAogICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAiQWJlTGlAbWljcm9zb2Z0LmNvbSIsCiAgIm9pZCI6ICIwMDAwMDAwMC0wMDAwLTAwMDAtNjZmMy0zMzMyZWNhN2VhODEiLAogICJlbWFpbCI6ICJBYmVMaUBtaWNyb3NvZnQuY29tIiwKICAidGlkIjogIjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsCiAgIm5vbmNlIjogIjEyMzUyMyIsCiAgImFpbyI6ICJEZjJVVlhMMWl4IWxNQ1dNU09KQmNGYXR6Y0dmdkZHaGpLdjhxNWcweDczMmRSNU1CNUJpc3ZHUU83WVdCeWpkOGlRRExxIWVHYklEYWt5cDVtbk9yY2RxSGVZU25sdGVwUW1ScDZBSVo4alkiCn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
    LOGIN_AT_STRING: "O35pBcPgsXxS0K54JcJ2bO2lPQzy59r98BM3TLUNV5lJfzLYv5ZL2c8i3IODbS9qx93DzmpKlOgdQLrFDctgSbutgFXUKLdNIeR1ZvzCSEbwtV4zOe0EJU0CkVaWo1Vg8iKrdJdGtEqOtOB3Pbqe2zMg0cuMXW4B6xtbDy5gYO78McdjKWiljdltJqPTZkb1ESbGOGM2",
    ACCESS_TOKEN: "this.isan.accesstoken",
    POP_TOKEN: "eyJ0eXAiOiJKV1QiLCJub25jZSI6InFMZmZKT255c2dnVnhhdGxSbVhvR0dnYkx3NDV5LTdsWkswaHJWSm9zeDQiLCJhbGciOiJSUzI1NiIsIng1dCI6InZhcF9pdmtIdHRMRmNubm9CWEF3SjVIWDBLNCIsImtpZCI6InZhcF9pdmtIdHRMRmNubm9CWEF3SjVIWDBLNCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLXBwZS5uZXQvMTllZWEyZjgtZTE3YS00NzBmLTk1NGQtZDg5N2M0N2YzMTFjLyIsImlhdCI6MTYxODAwNzU2MCwibmJmIjoxNjE4MDA3NTYwLCJleHAiOjE2MTgwMTE0NjAsImFjY3QiOjAsImFjciI6IjEiLCJhY3JzIjpbInVybjp1c2VyOnJlZ2lzdGVyc2VjdXJpdHlpbmZvIiwidXJuOm1pY3Jvc29mdDpyZXExIiwidXJuOm1pY3Jvc29mdDpyZXEyIiwidXJuOm1pY3Jvc29mdDpyZXEzIiwiYzEiLCJjMiIsImMzIiwiYzQiLCJjNSIsImM2IiwiYzciLCJjOCIsImM5IiwiYzEwIiwiYzExIiwiYzEyIiwiYzEzIiwiYzE0IiwiYzE1IiwiYzE2IiwiYzE3IiwiYzE4IiwiYzE5IiwiYzIwIiwiYzIxIiwiYzIyIiwiYzIzIiwiYzI0IiwiYzI1Il0sImFpbyI6IkUyTmdZRGo3Y0dVWEczT1p4OXhXSjVNRWg5MXU2NVFTZnAzVXYycVpLSHByaHRtVkY2d0EiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6IlBLLU1TQUxUZXN0Mi4wIiwiYXBwaWQiOiIzZmJhNTU2ZS01ZDRhLTQ4ZTMtOGUxYS1mZDU3YzEyY2I4MmUiLCJhcHBpZGFjciI6IjAiLCJjbmYiOnsia2lkIjoiVjZOX0hNUGFnTnBZU193eE0xNFg3M3EzZVd6YlRyOVozMVJ5SGtJY04wWSIsInhtc19rc2wiOiJzdyJ9LCJmYW1pbHlfbmFtZSI6IkJhc2ljIFVzZXIiLCJnaXZlbl9uYW1lIjoiQ2xvdWQgSURMQUIiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIyNC4xNy4yNDYuMjA5IiwibmFtZSI6IkNsb3VkIElETEFCIEJhc2ljIFVzZXIiLCJvaWQiOiJiZTA2NGMzNy0yNjE3LTQ2OGMtYjYyNy0yNWI0ZTQ4MTdhZGYiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzQwMDAwMDU0NzdCQSIsInJoIjoiMC5BQUFBLUtMdUdYcmhEMGVWVGRpWHhIOHhIRzVWdWo5S1hlTklqaHI5VjhFc3VDNEJBTmsuIiwic2NwIjoiRmlsZXMuUmVhZCBNYWlsLlJlYWQgb3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkIGVtYWlsIiwic2lnbmluX3N0YXRlIjpbImttc2kiXSwic3ViIjoidExjaFl1bUczSXZZT1VrQlprU0EzbWhnOEVfYnNGZDhuU2licUlOX0UxVSIsInRpZCI6IjE5ZWVhMmY4LWUxN2EtNDcwZi05NTRkLWQ4OTdjNDdmMzExYyIsInVuaXF1ZV9uYW1lIjoiSURMQUJAbXNpZGxhYjAuY2NzY3RwLm5ldCIsInVwbiI6IklETEFCQG1zaWRsYWIwLmNjc2N0cC5uZXQiLCJ1dGkiOiJ5a2tPd3dyTkFVT1k5SUVXejRITEFBIiwidmVyIjoiMS4wIiwid2lkcyI6WyJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX3N0Ijp7InN1YiI6Imx2QnRkdmVkdDRkT1pyeGZvQjdjbV9UTkU3THFucG5lcGFHc3EtUmZkS2MifSwieG1zX3RjZHQiOjE1NDQ1NzQzNjN9.VPBqUrMDc-H1T4paZoSbGaec0lBoJqSiu13chxJmgee1lDxUFr2pM52tqzPPH6N_Yk-VQ0_AKTyvfnbAQw4mryhp3SJytZbU7FedrXX7oq2laLh9s0K_Hz1EZSj5xg3SSUxXmKEjdePN6d0_5MLlt1P-LcL2PAGgkEEBhUfDm6pAxyTMO8Mw1DUYbq7kr_IzyQ71V-kuoYHDjazghSIwOkidoWMCPP-HIENVbFEKUDKFGDiOzU76IagUBAYUQ4JD1bC9hHA-OO6AV8xLK7UoPyx9UH7fLbiImzhARBxMkmAQu9v2kwn5Hl9hoBEBhlu48YOYOr4O3GxwKisff87R9Q",
    REFRESH_TOKEN: "thisIsARefreshT0ken"
};

export const ID_TOKEN_CLAIMS = {
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

// Test Expiration Vals
export const TEST_TOKEN_LIFETIMES = {
    DEFAULT_EXPIRES_IN: 3599,
    TEST_ID_TOKEN_EXP: 1536361411,
    TEST_ACCESS_TOKEN_EXP: 1537234948
};

// Test CLIENT_INFO
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
    TEST_HOME_ACCOUNT_ID: "MTIzLXRlc3QtdWlk.NDU2LXRlc3QtdXRpZA==",
    TEST_LOCAL_ACCOUNT_ID: "00000000-0000-0000-66f3-3332eca7ea81s"
};

export const TEST_POP_VALUES = {
    KID: "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs",
    ENCODED_REQ_CNF: "eyJraWQiOiJOemJMc1hoOHVEQ2NkLTZNTndYRjRXXzdub1dYRlpBZkhreFpzUkdDOVhzIiwieG1zX2tzbCI6InN3In0=",
    DECODED_REQ_CNF: "{\"kid\":\"NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs\",\"xms_ksl\":\"sw\"}"
};

export const TEST_SSH_VALUES = {
    SSH_JWK: "{\"kty\":\"RSA\",\"n\":\"wDJwv083ZhGGkpMPVcBMwtSBNLu7qhT2VmKv7AyPEz_dWb8GQzNEnWT1niNjFI0isDMFWQ7X2O-dhTL9J1QguQ==\",\"e\":\"AQAB\"}",
    ENCODED_SSH_JWK: "%7B%22kty%22%3A%22RSA%22%2C%22n%22%3A%22wDJwv083ZhGGkpMPVcBMwtSBNLu7qhT2VmKv7AyPEz_dWb8GQzNEnWT1niNjFI0isDMFWQ7X2O-dhTL9J1QguQ%3D%3D%22%2C%22e%22%3A%22AQAB%22%7D",
    SSH_KID: "TestSSHKeyId",
    ALTERNATE_SSH_JWK: "{\"p\":\"zN8SHQ_QsbEMNwrA3ZpKn2ulmKGZfAfrOnouojvUIzuH13y-sWUfiDADgei4MG3j5fJHFPuMdKE5zdYKgsC3eyImeAzNd10ZDRUaMXubg1fyyvlf7hE4cvrwaQ0MftXsvlCLi1nkK_DjnPjAonqvbRMOS6YyUXAZBZyfLaZ76cU\",\"kty\":\"RSA\",\"q\":\"yrsb5PwGF5Lvtx1CCSX6j0fhNDjwK7LkKvfE1qhrGgv3Cu9HBUb90qoj0qewA1prPQBN3cjrKv19zIrIV2ac3-p_j6jKotd7o2-t0jXpSW7wlGFpArIf2nxDyJo1KeimDi697hbESb_gPYGeno0TJTdmIyYWB8_JHm06cGkU3P0\",\"d\":\"U4A5WR4L4cqActlO0PALdBF9_Myc4Zzk401Uo3bufsI3AGw9EFkARIq7U2T4PAnPbhUr-mT3zIYsLD6Ck1-PNE9gJbeQXgBRHJWCZe6s90FoeQZl1k2ADjjwOWjf5MyTxTSmdH7ENIABLzsukz3EQnsEZIGM4bnpaC-5wfZ5THI8FFEIMh-sEro1BbI_roohwKoDiOmzpthrxbqoFXq7YfEOjZ9i_H8mvCunMuQQ0CZLZfGTKoKN5ZcQkQSdy4wAVzln5eXtm-lxWFXrB-EL8qgDUrsx9HAxKxjACKNoTdgttGy3G434OJqh7QB5iGtHaXVb5wEvUeJXXa_N44Sd4Q\",\"e\":\"AQAB\",\"use\":\"enc\",\"kid\":\"40890f08-6b55-450f-9443-a6d5cef8b6d0\",\"qi\":\"OQ2Ku_syiEvUEvixOyyBSuq5UuoQLwaecExggwUaJZF-zpRv76fsxxaKYZiTZU-80cLMIOfsYbxMU1_p_VI4gKOr8vnY10VSCBSge8UX6InuLzVGdx8UoMb-q0rhmStw2hhfFzLzrZSYvooxMX_PQQTkmyhyVck9Pp-5hVPg3hI","dp":"XMccndqeqQnDvV16UCDicGXAfWmZZ2jypu3UFpY_kKER-I0-knl4GSWdQQSR_SSW03ivphnw1pR45_VplyMNNI8XmsA5gDfB84G99fDDUWzPwAnE3rwfszpfC0Pkh7_7UYiKWVYhFaEmgtzH6AzlSuEZVTrziJvaSQdPss21Sf0\",\"dq\":\"MqBTMPW218A72LCXww0W6xz6Ij5ty5va2tgQ8cIRLOn8AWELjUfTLv6J_5scm1nDGfKvf0kjYRL4jVHDAgCAAHLg9BEkuVGycHf9IleQMGRh88v3m1K8HaWWj8viptqQTU5i48gPsJMX_oQWBmYYd9zDxtdF_SFoig6g311-dkk","n":"oj3Bj_D64iFCgtRAInqXbiIrTxbMBw6D6QFCam84CjS3U3cvOjqBhaWPciqPZFYAk3T4_7_HDu-v_iNb5R5Nae0PQ3hXt99y3n0ZwVE_LQ4hQuMLWCQ8YaQnLjrBCJR1YWD6d92UGXj6Jm_a80wmrcxZ6z_W-thUacdGN6Y5P5bLTq-dAYf92ZQxTx9-nIV8BA0jnFt0F_tMuBU-sec8Z2vSq8KQjllWgXarB6aKq7g4RsJAgGqC-kVwskE2WrXKiTVgnA-mvBhRwJE2TMYdi0dMT2eCZCA6Hym2rj_7PRT5QCTflYWPh7Ya3blc4ET9xC8akghPMZjVfEfwFb9TsQ\"}",
    ALTERNATE_ENCODED_SSH_JWK: "%7B%22p%22%3A%22zN8SHQ_QsbEMNwrA3ZpKn2ulmKGZfAfrOnouojvUIzuH13y-sWUfiDADgei4MG3j5fJHFPuMdKE5zdYKgsC3eyImeAzNd10ZDRUaMXubg1fyyvlf7hE4cvrwaQ0MftXsvlCLi1nkK_DjnPjAonqvbRMOS6YyUXAZBZyfLaZ76cU%22%2C%22kty%22%3A%22RSA%22%2C%22q%22%3A%22yrsb5PwGF5Lvtx1CCSX6j0fhNDjwK7LkKvfE1qhrGgv3Cu9HBUb90qoj0qewA1prPQBN3cjrKv19zIrIV2ac3-p_j6jKotd7o2-t0jXpSW7wlGFpArIf2nxDyJo1KeimDi697hbESb_gPYGeno0TJTdmIyYWB8_JHm06cGkU3P0%22%2C%22d%22%3A%22U4A5WR4L4cqActlO0PALdBF9_Myc4Zzk401Uo3bufsI3AGw9EFkARIq7U2T4PAnPbhUr-mT3zIYsLD6Ck1-PNE9gJbeQXgBRHJWCZe6s90FoeQZl1k2ADjjwOWjf5MyTxTSmdH7ENIABLzsukz3EQnsEZIGM4bnpaC-5wfZ5THI8FFEIMh-sEro1BbI_roohwKoDiOmzpthrxbqoFXq7YfEOjZ9i_H8mvCunMuQQ0CZLZfGTKoKN5ZcQkQSdy4wAVzln5eXtm-lxWFXrB-EL8qgDUrsx9HAxKxjACKNoTdgttGy3G434OJqh7QB5iGtHaXVb5wEvUeJXXa_N44Sd4Q%22%2C%22e%22%3A%22AQAB%22%2C%22use%22%3A%22enc%22%2C%22kid%22%3A%2240890f08-6b55-450f-9443-a6d5cef8b6d0%22%2C%22qi%22%3A%22OQ2Ku_syiEvUEvixOyyBSuq5UuoQLwaecExggwUaJZF-zpRv76fsxxaKYZiTZU-80cLMIOfsYbxMU1_p_VI4gKOr8vnY10VSCBSge8UX6InuLzVGdx8UoMb-q0rhmStw2hhfFzLzrZSYvooxMX_PQQTkmyhyVck9Pp-5hVPg3hI%22%2C%22dp%22%3A%22XMccndqeqQnDvV16UCDicGXAfWmZZ2jypu3UFpY_kKER-I0-knl4GSWdQQSR_SSW03ivphnw1pR45_VplyMNNI8XmsA5gDfB84G99fDDUWzPwAnE3rwfszpfC0Pkh7_7UYiKWVYhFaEmgtzH6AzlSuEZVTrziJvaSQdPss21Sf0%22%2C%22dq%22%3A%22MqBTMPW218A72LCXww0W6xz6Ij5ty5va2tgQ8cIRLOn8AWELjUfTLv6J_5scm1nDGfKvf0kjYRL4jVHDAgCAAHLg9BEkuVGycHf9IleQMGRh88v3m1K8HaWWj8viptqQTU5i48gPsJMX_oQWBmYYd9zDxtdF_SFoig6g311-dkk%22%2C%22n%22%3A%22oj3Bj_D64iFCgtRAInqXbiIrTxbMBw6D6QFCam84CjS3U3cvOjqBhaWPciqPZFYAk3T4_7_HDu-v_iNb5R5Nae0PQ3hXt99y3n0ZwVE_LQ4hQuMLWCQ8YaQnLjrBCJR1YWD6d92UGXj6Jm_a80wmrcxZ6z_W-thUacdGN6Y5P5bLTq-dAYf92ZQxTx9-nIV8BA0jnFt0F_tMuBU-sec8Z2vSq8KQjllWgXarB6aKq7g4RsJAgGqC-kVwskE2WrXKiTVgnA-mvBhRwJE2TMYdi0dMT2eCZCA6Hym2rj_7PRT5QCTflYWPh7Ya3blc4ET9xC8akghPMZjVfEfwFb9TsQ%22%7D",
    ALTERNATE_SSH_KID: "AlternateSSHKeyId"
};

export const TEST_STATE_VALUES = {
    USER_STATE: "userState",
    TEST_TIMESTAMP: 1592846482,
    DECODED_LIB_STATE: `{"id":"${RANDOM_TEST_GUID}"}`,
    ENCODED_LIB_STATE: "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSJ9",
    TEST_STATE_REDIRECT: `eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0=${Constants.RESOURCE_DELIM}userState`,
    TEST_STATE_POPUP: `eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicG9wdXAifX0=${Constants.RESOURCE_DELIM}userState`,
    TEST_STATE_SILENT: `eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoic2lsZW50In19${Constants.RESOURCE_DELIM}userState`
};

// Test Hashes
export const TEST_HASHES = {
    TEST_SUCCESS_ID_TOKEN_HASH: `#id_token=${TEST_TOKENS.IDTOKEN_V2}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_SUCCESS_ACCESS_TOKEN_HASH: `#access_token=${TEST_TOKENS.ACCESS_TOKEN}&id_token=${TEST_TOKENS.IDTOKEN_V2}&scope=test&expiresIn=${TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_SUCCESS_CODE_HASH_REDIRECT: `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_SUCCESS_CODE_HASH_POPUP: `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${TEST_STATE_VALUES.TEST_STATE_POPUP}`,
    TEST_SUCCESS_CODE_HASH_SILENT: `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${TEST_STATE_VALUES.TEST_STATE_SILENT}`,
    TEST_ERROR_HASH: `#error=error_code&error_description=msal+error+description&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_INTERACTION_REQ_ERROR_HASH1: `#error=interaction_required&error_description=msal+error+description&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_INTERACTION_REQ_ERROR_HASH2: `#error=interaction_required&error_description=msal+error+description+interaction_required&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_LOGIN_REQ_ERROR_HASH1: `#error=login_required&error_description=msal+error+description&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_LOGIN_REQ_ERROR_HASH2: `#error=login_required&error_description=msal+error+description+login_required&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_CONSENT_REQ_ERROR_HASH1: `#error=consent_required&error_description=msal+error+description&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_CONSENT_REQ_ERROR_HASH2: `#error=consent_required&error_description=msal+error+description+consent_required&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_SUCCESS_HASH_NO_STATE: `#id_token=${TEST_TOKENS.IDTOKEN_V2}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}`,
    TEST_SUCCESS_HASH_STATE_NO_META: `#id_token=${TEST_TOKENS.IDTOKEN_V2}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${TEST_STATE_VALUES.ENCODED_LIB_STATE}`,
    TEST_SUCCESS_NATIVE_ACCOUNT_ID_POPUP: `#accountId=test-nativeAccountId&state=${TEST_STATE_VALUES.TEST_STATE_POPUP}`,
    TEST_SUCCESS_NATIVE_ACCOUNT_ID_REDIRECT: `#accountId=test-nativeAccountId&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
    TEST_SUCCESS_NATIVE_ACCOUNT_ID_SILENT: `#accountId=test-nativeAccountId&state=${TEST_STATE_VALUES.TEST_STATE_SILENT}`
};

// Test Crypto Values
export const TEST_CRYPTO_VALUES = {
    TEST_SHA256_HASH: "vdluSPGh34Y-nFDCbX7CudVKZIXRG1rquljNBbn7xuE"
}

export const DEFAULT_TENANT_DISCOVERY_RESPONSE = {
    headers: {},
    status: 200,
    body: {
        "tenant_discovery_endpoint":"https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
        "api-version":"1.1",
        "metadata":[
            {
                "preferred_network":"login.microsoftonline.com",
                "preferred_cache":"login.windows.net",
                "aliases":["login.microsoftonline.com","login.windows.net","login.microsoft.com","sts.windows.net"]
            },
            {
                "preferred_network":"login.partner.microsoftonline.cn",
                "preferred_cache":"login.partner.microsoftonline.cn",
                "aliases":["login.partner.microsoftonline.cn","login.chinacloudapi.cn"]
            },
            {
                "preferred_network":"login.microsoftonline.de",
                "preferred_cache":"login.microsoftonline.de",
                "aliases":["login.microsoftonline.de"]
            },
            {
                "preferred_network":"login.microsoftonline.us",
                "preferred_cache":"login.microsoftonline.us",
                "aliases":["login.microsoftonline.us","login.usgovcloudapi.net"]
            },
            {
                "preferred_network":"login-us.microsoftonline.com",
                "preferred_cache":"login-us.microsoftonline.com",
                "aliases":["login-us.microsoftonline.com"]
            }
        ]
    }
};

export const DEFAULT_OPENID_CONFIG_RESPONSE: NetworkResponse<any> = {
    headers: {},
    status: 200,
    body : {
        "token_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        "token_endpoint_auth_methods_supported": [
            "client_secret_post",
            "private_key_jwt",
            "client_secret_basic"
        ],
        "jwks_uri": "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
        "response_modes_supported": [
            "query",
            "fragment",
            "form_post"
        ],
        "subject_types_supported": ["pairwise"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "response_types_supported": ["code", "id_token", "code id_token", "id_token token"],
        "scopes_supported": ["openid", "profile", "email", "offline_access"],
        "issuer": "https://login.microsoftonline.com/{tenant}/v2.0",
        "request_uri_parameter_supported": false,
        "userinfo_endpoint": "https://graph.microsoft.com/oidc/userinfo",
        "authorization_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
        "http_logout_supported": true,
        "frontchannel_logout_supported": true,
        "end_session_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/logout",
        "claims_supported": ["sub", "iss", "cloud_instance_name", "cloud_instance_host_name", "cloud_graph_host_name", "msgraph_host", "aud", "exp", "iat", "auth_time", "acr", "nonce", "preferred_username", "name", "tid", "ver", "at_hash", "c_hash", "email"],
        "tenant_region_scope": null,
        "cloud_instance_name": "microsoftonline.com",
        "cloud_graph_host_name": "graph.windows.net",
        "msgraph_host": "graph.microsoft.com",
        "rbac_url": "https://pas.windows.net"
    }
};

export const ALTERNATE_OPENID_CONFIG_RESPONSE = {
    headers: null,
    status: 200,
    body: {
        "token_endpoint": "https://login.windows.net/common/oauth2/v2.0/token",
        "token_endpoint_auth_methods_supported": [
            "client_secret_post",
            "private_key_jwt",
            "client_secret_basic"
        ],
        "jwks_uri": "https://login.windows.net/common/discovery/v2.0/keys",
        "response_modes_supported": [
            "query",
            "fragment",
            "form_post"
        ],
        "subject_types_supported": ["pairwise"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "response_types_supported": ["code", "id_token", "code id_token", "id_token token"],
        "scopes_supported": ["openid", "profile", "email", "offline_access"],
        "issuer": "https://login.windows.net/{tenantid}/v2.0",
        "request_uri_parameter_supported": false,
        "userinfo_endpoint": "https://graph.microsoft.com/oidc/userinfo",
        "authorization_endpoint": "https://login.windows.net/common/oauth2/v2.0/authorize",
        "http_logout_supported": true,
        "frontchannel_logout_supported": true,
        "end_session_endpoint": "https://login.windows.net/common/oauth2/v2.0/logout",
        "claims_supported": ["sub", "iss", "cloud_instance_name", "cloud_instance_host_name", "cloud_graph_host_name", "msgraph_host", "aud", "exp", "iat", "auth_time", "acr", "nonce", "preferred_username", "name", "tid", "ver", "at_hash", "c_hash", "email"],
        "tenant_region_scope": null,
        "cloud_instance_name": "windows.net",
        "cloud_graph_host_name": "graph.windows.net",
        "msgraph_host": "graph.microsoft.com",
        "rbac_url": "https://pas.windows.net"
    }
};

export const testNavUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(`${TEST_CONFIG.MSAL_CLIENT_ID}`)}&scope=user.read%20openid%20profile%20offline_access&redirect_uri=https%3A%2F%2Flocalhost%3A8081%2Findex.html&client-request-id=${encodeURIComponent(`${RANDOM_TEST_GUID}`)}&response_mode=fragment&response_type=code&x-client-SKU=msal.js.browser&x-client-VER=${version}&x-app-name=${TEST_CONFIG.applicationName}&x-app-ver=${TEST_CONFIG.applicationVersion}&client_info=1&code_challenge=JsjesZmxJwehdhNY9kvyr0QOeSMEvryY_EHZo3BKrqg&code_challenge_method=S256&nonce=${encodeURIComponent(`${RANDOM_TEST_GUID}`)}&state=${encodeURIComponent(`${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`)}`;

export const testNavUrlNoRequest = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(`${TEST_CONFIG.MSAL_CLIENT_ID}`)}&scope=openid%20profile%20offline_access&redirect_uri=https%3A%2F%2Flocalhost%3A8081%2Findex.html&client-request-id=${encodeURIComponent(`${RANDOM_TEST_GUID}`)}&response_mode=fragment&response_type=code&x-client-SKU=msal.js.browser&x-client-VER=${version}&x-app-name=${TEST_CONFIG.applicationName}&x-app-ver=${TEST_CONFIG.applicationVersion}&client_info=1&code_challenge=JsjesZmxJwehdhNY9kvyr0QOeSMEvryY_EHZo3BKrqg&code_challenge_method=S256&nonce=${encodeURIComponent(`${RANDOM_TEST_GUID}`)}&state=`;

export const testLogoutUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(`${TEST_URIS.TEST_REDIR_URI}`)}`;
