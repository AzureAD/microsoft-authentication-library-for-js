/**
 * This file contains the string constants used by the test classes.
 */

// Test Tokens
export const TEST_TOKENS = {
    // idTokens referenced from MSFT docs: https://docs.microsoft.com/en-us/azure/active-directory/develop/id-tokens
    // accessTokens referenced from MSFT docs: https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens
    IDTOKEN_V1: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyIsImtpZCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyJ9.eyJhdWQiOiJiMTRhNzUwNS05NmU5LTQ5MjctOTFlOC0wNjAxZDBmYzljYWEiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9mYTE1ZDY5Mi1lOWM3LTQ0NjAtYTc0My0yOWYyOTU2ZmQ0MjkvIiwiaWF0IjoxNTM2Mjc1MTI0LCJuYmYiOjE1MzYyNzUxMjQsImV4cCI6MTUzNjI3OTAyNCwiYWlvIjoiQVhRQWkvOElBQUFBcXhzdUIrUjREMnJGUXFPRVRPNFlkWGJMRDlrWjh4ZlhhZGVBTTBRMk5rTlQ1aXpmZzN1d2JXU1hodVNTajZVVDVoeTJENldxQXBCNWpLQTZaZ1o5ay9TVTI3dVY5Y2V0WGZMT3RwTnR0Z2s1RGNCdGsrTExzdHovSmcrZ1lSbXY5YlVVNFhscGhUYzZDODZKbWoxRkN3PT0iLCJhbXIiOlsicnNhIl0sImVtYWlsIjoiYWJlbGlAbWljcm9zb2Z0LmNvbSIsImZhbWlseV9uYW1lIjoiTGluY29sbiIsImdpdmVuX25hbWUiOiJBYmUiLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaXBhZGRyIjoiMTMxLjEwNy4yMjIuMjIiLCJuYW1lIjoiYWJlbGkiLCJub25jZSI6IjEyMzUyMyIsIm9pZCI6IjA1ODMzYjZiLWFhMWQtNDJkNC05ZWMwLTFiMmJiOTE5NDQzOCIsInJoIjoiSSIsInN1YiI6IjVfSjlyU3NzOC1qdnRfSWN1NnVlUk5MOHhYYjhMRjRGc2dfS29vQzJSSlEiLCJ0aWQiOiJmYTE1ZDY5Mi1lOWM3LTQ0NjAtYTc0My0yOWYyOTU2ZmQ0MjkiLCJ1bmlxdWVfbmFtZSI6IkFiZUxpQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJMeGVfNDZHcVRrT3BHU2ZUbG40RUFBIiwidmVyIjoiMS4wIn0=.UJQrCA6qn2bXq57qzGX_-D3HcPHqBMOKDPx4su1yKRLNErVD8xkxJLNLVRdASHqEcpyDctbdHccu6DPpkq5f0ibcaQFhejQNcABidJCTz0Bb2AbdUCTqAzdt9pdgQvMBnVH1xk3SCM6d4BbT4BkLLj10ZLasX7vRknaSjE_C5DI7Fg4WrZPwOhII1dB0HEZ_qpNaYXEiy-o94UJ94zCr07GgrqMsfYQqFR7kn-mn68AjvLcgwSfZvyR_yIK75S_K37vC3QryQ7cNoafDe9upql_6pB2ybMVlgWPs_DmbJ8g0om-sPlwyn74Cc1tW3ze-Xptw_2uVdPgWyqfuWAfq6Q",
    IDTOKEN_V2: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
    IDTOKEN_V2_NEWCLAIM: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.ewogICJ2ZXIiOiAiMi4wIiwKICAiaXNzIjogImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS85MTg4MDQwZC02YzY3LTRjNWItYjExMi0zNmEzMDRiNjZkYWQvdjIuMCIsCiAgInN1YiI6ICJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwKICAiYXVkIjogIjZjYjA0MDE4LWEzZjUtNDZhNy1iOTk1LTk0MGM3OGY1YWVmMyIsCiAgImV4cCI6IDE1MzYzNjE0MTEsCiAgImlhdCI6IDE1MzYyNzQ3MTEsCiAgIm5iZiI6IDE1MzYyNzQ3MTEsCiAgIm5hbWUiOiAiQWJlIExpbmNvbG4iLAogICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAiQWJlTGlAbWljcm9zb2Z0LmNvbSIsCiAgIm9pZCI6ICIwMDAwMDAwMC0wMDAwLTAwMDAtNjZmMy0zMzMyZWNhN2VhODEiLAogICJlbWFpbCI6ICJBYmVMaUBtaWNyb3NvZnQuY29tIiwKICAidGlkIjogIjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsCiAgIm5vbmNlIjogIjEyMzUyMyIsCiAgImFpbyI6ICJEZjJVVlhMMWl4IWxNQ1dNU09KQmNGYXR6Y0dmdkZHaGpLdjhxNWcweDczMmRSNU1CNUJpc3ZHUU83WVdCeWpkOGlRRExxIWVHYklEYWt5cDVtbk9yY2RxSGVZU25sdGVwUW1ScDZBSVo4alkiCn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
    LOGIN_AT_STRING: "O35pBcPgsXxS0K54JcJ2bO2lPQzy59r98BM3TLUNV5lJfzLYv5ZL2c8i3IODbS9qx93DzmpKlOgdQLrFDctgSbutgFXUKLdNIeR1ZvzCSEbwtV4zOe0EJU0CkVaWo1Vg8iKrdJdGtEqOtOB3Pbqe2zMg0cuMXW4B6xtbDy5gYO78McdjKWiljdltJqPTZkb1ESbGOGM2",
    ACCESS_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSJ9.eyJhdWQiOiI2ZTc0MTcyYi1iZTU2LTQ4NDMtOWZmNC1lNjZhMzliYjEyZTMiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3YyLjAiLCJpYXQiOjE1MzcyMzEwNDgsIm5iZiI6MTUzNzIzMTA0OCwiZXhwIjoxNTM3MjM0OTQ4LCJhaW8iOiJBWFFBaS84SUFBQUF0QWFaTG8zQ2hNaWY2S09udHRSQjdlQnE0L0RjY1F6amNKR3hQWXkvQzNqRGFOR3hYZDZ3TklJVkdSZ2hOUm53SjFsT2NBbk5aY2p2a295ckZ4Q3R0djMzMTQwUmlvT0ZKNGJDQ0dWdW9DYWcxdU9UVDIyMjIyZ0h3TFBZUS91Zjc5UVgrMEtJaWpkcm1wNjlSY3R6bVE9PSIsImF6cCI6IjZlNzQxNzJiLWJlNTYtNDg0My05ZmY0LWU2NmEzOWJiMTJlMyIsImF6cGFjciI6IjAiLCJuYW1lIjoiQWJlIExpbmNvbG4iLCJvaWQiOiI2OTAyMjJiZS1mZjFhLTRkNTYtYWJkMS03ZTRmN2QzOGU0NzQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhYmVsaUBtaWNyb3NvZnQuY29tIiwicmgiOiJJIiwic2NwIjoiYWNjZXNzX2FzX3VzZXIiLCJzdWIiOiJIS1pwZmFIeVdhZGVPb3VZbGl0anJJLUtmZlRtMjIyWDVyclYzeERxZktRIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidXRpIjoiZnFpQnFYTFBqMGVRYTgyUy1JWUZBQSIsInZlciI6IjIuMCJ9.pj4N-w_3Us9DrBLfpCt",
    REFRESH_TOKEN: "MCQmFj8OGUfgZXBsa2KZIvBmgSgBKBqysTSOUOqIyrZxGMWIFTValmuJXUEZJFkSTtM8X88FleosPOFNrZamdNqebLs0qduvBldOELI53j5dMHZz2n!61juCkIdowu7CwmUeyKoCAoDoKVj6Obqro0ns16nytUozuUT6DVAwVJGYrAbZWnVUeC537Nblwc4k*i1qcFW6MJ0vl492tMRnpeZNGnZS98q!Gn8XLISlzSqUstzcvwSA47OWdiaCF0hu4nVThwpQYSMLwEBtXdMJiLsDZGSHBy1CHdh!GIQMWMYbkAp5STDLLLTotuczC9z4D3oxNWzQ9h8GfttjKjvtmT*H!HDDBVUflyEZKuGHnHOfexd5xBMU16aQVWLlwLdHPeSnJfAngoW7Vjs3T2V1BJ6FvSoR8PQG63Pkx5qWc!belyupz1ONyl!ND5SuHADVtYg$$",
    SAMPLE_JWT: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    SAMPLE_MALFORMED_JWT: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    SAMPLE_JWT_HEADER: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    SAMPLE_JWT_PAYLOAD: "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    SAMPLE_JWT_SIG: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
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
    TEST_UTID: "456-test-utid",
    TEST_DECODED_CLIENT_INFO: `{"uid":"123-test-uid","utid":"456-test-utid"}`,
    TEST_INVALID_JSON_CLIENT_INFO: `{"uid":"123-test-uid""utid":"456-test-utid"}`,
    TEST_RAW_CLIENT_INFO: "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9",
    TEST_CLIENT_INFO_B64ENCODED: "eyJ1aWQiOiIxMjM0NSIsInV0aWQiOiI2Nzg5MCJ9",
    TEST_HOME_ACCOUNT_ID: "MTIzLXRlc3QtdWlk.NDU2LXRlc3QtdXRpZA=="
};

// Test Hashes
export const TEST_HASHES = {
    TEST_SUCCESS_ID_TOKEN_HASH: `#id_token=${TEST_TOKENS.IDTOKEN_V2}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|`,
    TEST_SUCCESS_ACCESS_TOKEN_HASH: `#access_token=${TEST_TOKENS.ACCESS_TOKEN}&id_token=${TEST_TOKENS.IDTOKEN_V2}&scope=test&expiresIn=${TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|`,
    TEST_SUCCESS_CODE_HASH: `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|testState`,
    TEST_ERROR_HASH: "#error=error_code&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_INTERACTION_REQ_ERROR_HASH1: "#error=interaction_required&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_INTERACTION_REQ_ERROR_HASH2: "#error=interaction_required&error_description=msal+error+description+interaction_required&state=RANDOM-GUID-HERE|",
    TEST_LOGIN_REQ_ERROR_HASH1: "#error=login_required&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_LOGIN_REQ_ERROR_HASH2: "#error=login_required&error_description=msal+error+description+login_required&state=RANDOM-GUID-HERE|",
    TEST_CONSENT_REQ_ERROR_HASH1: "#error=consent_required&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_CONSENT_REQ_ERROR_HASH2: "#error=consent_required&error_description=msal+error+description+consent_required&state=RANDOM-GUID-HERE|"
};

// Test URIs
export const TEST_URIS = {
    DEFAULT_INSTANCE: "https://login.microsoftonline.com/",
    ALTERNATE_INSTANCE: "https://login.windows.net/",
    TEST_REDIR_URI: "https://localhost:8081/index.html",
    TEST_LOGOUT_URI: "https://localhost:8081/logout.html",
    TEST_AUTH_ENDPT: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    TEST_AUTH_ENDPT_ORGS: "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
    TEST_AUTH_ENDPT_TENANT_ID: "https://login.microsoftonline.com/sample-tenantID/oauth2/v2.0/authorize",
    TEST_AUTH_ENDPT_WITH_PARAMS1: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?param1=value1",
    TEST_AUTH_ENDPT_WITH_PARAMS2: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?param1=value1&param2=value2"
};

// Test MSAL config params
export const TEST_CONFIG = {
    TENANT: "common",
    MSAL_CLIENT_ID: "0813e1d1-ad72-46a9-8665-399bba48c201",
    MSAL_CLIENT_SECRET: "ThisIsASecret",
    MSAL_TENANT_ID: "3338040d-6c67-4c5b-b112-36a304b66dad",
    validAuthority: TEST_URIS.DEFAULT_INSTANCE + "common",
    alternateValidAuthority: TEST_URIS.ALTERNATE_INSTANCE + "common",
    applicationName: "msal.js-tests",
    applicationVersion: "msal.js-tests.1.0.fake",
    STATE: "1234",
    TEST_VERIFIER: "Y5LnOOlAWK0kt370Bjm0ZcrW9Sc2pMXR1slip9TFZXoyUV8Y8lCn0WHXyyQ1QcTnALMbrUAj85dC7WIe6gYqc8o8jsHCezP3xiUNB143A5IfwtSfO6Kb8oy7pNqcT9vN",
    TEST_CHALLENGE: "JsjesZmxJwehdhNY9kvyr0QOeSMEvryY_EHZo3BKrqg",
    TOKEN_TYPE_BEARER: "Bearer",
    DEFAULT_SCOPES: ["openid", "profile", "offline_access"]
};

export const RANDOM_TEST_GUID = "11553a9b-7116-48b1-9d48-f6d4a8ff8371";

export const TEST_HOST_LIST = [
    "login.windows.net",
    "login.chinacloudapi.cn",
    "login.cloudgovapi.us",
    "login.microsoftonline.com",
    "login.microsoftonline.de",
    "login.microsoftonline.us"
];

export const DEFAULT_TENANT_DISCOVERY_RESPONSE = {
    "tenant_discovery_endpoint":"https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
};

export const TEST_TENANT_DISCOVERY_RESPONSE = {
    "tenant_discovery_endpoint":"https://login.contoso.com/tenant-id/v2.0/.well-known/openid-configuration"
};

export const DEFAULT_OPENID_CONFIG_RESPONSE = { 
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
};

export const ALTERNATE_OPENID_CONFIG_RESPONSE = { 
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
};
