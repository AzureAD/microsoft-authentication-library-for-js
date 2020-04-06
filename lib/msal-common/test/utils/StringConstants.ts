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
    ACCESS_TOKEN: "thisIs.an.accessT0ken",
    REFRESH_TOKEN: "thisIsARefreshT0ken",
    AUTHORIZATION_CODE: "0.ASgAqPq4kJXMDkamGO53C-4XWVm3ypmrKgtCkdhePY1PBjsoAJg.AQABAAIAAAAm-06blBE1TpVMil8KPQ41DOje1jDj1oK3KxTXGKg89VjLYJi71gx_npOoxVfC7X49MqOX7IltTJOilUId-IAHndHXlfWzoSGq3GUmwAOLMisftceBRtq3YBsvHX7giiuSZXJgpgu03uf3V2h5Z3GJNpnSXT1f7iVFuRvGh1-jqjWxKs2un8AS5rhti1ym1zxkeicKT43va5jQeHVUlTQo69llnwQJ3iKmKLDVq_Q25Au4EQjYaeEx6TP5IZSqPPm7x0bynmjE8cqR5r4ySP4wH8fjnxlLySrUEZObk2VgREB1AdH6-xKIa04EnJEj9dUgTwiFvQumkuHHetFOgH7ep_9diFOdAOQLUK8C9N4Prlj0JiOcgn6l0xYd5Q9691Ylw8UfifLwq_B7f30mMLN64_XgoBY9K9CR1L4EC1kPPwIhVv3m6xmbhXZ3efx-A-bbV2SYcO4D4ZlnQztHzie_GUlredtsdEMAOE3-jaMJs7i2yYMuIEEtRcHIjV_WscVooCDdKmVncHOObWhNUSdULAejBr3pFs0v3QO_xZ269eLu5Z0qHzCZ_EPg2aL-ERz-rpgdclQ_H_KnEtMsC4F1RgAnDjVmSRKJZZdnNLfKSX_Wd40t_nuo4kjN2cSt8QzzeL533zIZ4CxthOsC4HH2RcUZDIgHdLDLT2ukg-Osc6J9URpZP-IUpdjXg_uwbkHEjrXDMBMo2pmCqaWbMJKo5Lr7CrystifnDITXzZmmOah8HV83Xyb6EP8Gno6JRuaG80j8BKDWyb1Yof4rnLI1kZ59n_t2d0LnRBXz50PdWCWX6vtkg-kAV-bGJQr45XDSKBSv0Q_fVsdLMk24NacUZcF5ujUtqv__Bv-wATzCHWlbUDGHC8nHEi84PcYAjSsgAA",
    SAMPLE_JWT_HEADER: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    SAMPLE_JWT_PAYLOAD: "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    SAMPLE_JWT_SIG: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    SAMPLE_MALFORMED_JWT: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
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
    TEST_AUTH_ENDPT_WITH_PARAMS2: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?param1=value1&param2=value2",
    TEST_REDIRECT_URI_LOCALHOST: "https://localhost:3000"
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
    NONCE: "a1b2c3",
    TEST_VERIFIER: "Y5LnOOlAWK0kt370Bjm0ZcrW9Sc2pMXR1slip9TFZXoyUV8Y8lCn0WHXyyQ1QcTnALMbrUAj85dC7WIe6gYqc8o8jsHCezP3xiUNB143A5IfwtSfO6Kb8oy7pNqcT9vN",
    TEST_CHALLENGE: "JsjesZmxJwehdhNY9kvyr0QOeSMEvryY_EHZo3BKrqg",
    CODE_CHALLENGE_METHOD: "S256",
    TOKEN_TYPE_BEARER: "Bearer",
    DEFAULT_SCOPES: ["openid", "profile", "offline_access"],
    DEFAULT_GRAPH_SCOPE: ["user.read"],
    LOGIN_HINT: "user@test.com",
    DOMAIN_HINT: "test.com",
    CORRELATION_ID: "7821e1d3-ad52-42t9-8666-399gea483401",
    CLAIMS: "claims"
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
    body: {
        "tenant_discovery_endpoint": "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
    }
};

export const TEST_TENANT_DISCOVERY_RESPONSE = {
    body: {
        "tenant_discovery_endpoint": "https://login.contoso.com/tenant-id/v2.0/.well-known/openid-configuration"
    }
};

export const DEFAULT_OPENID_CONFIG_RESPONSE = {
    body: {
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

export const AUTHENTICATION_RESULT = {
    status: 200,
    body: {
        "token_type": "Bearer",
        "scope": "openid profile User.Read email",
        "expires_in": 3599,
        "ext_expires_in": 3599,
        "access_token": "eyJ0eXAiOiJKV1QiLCJub25jZSI6Il9MWUUtN1ZYVkxKUmg3R0kzVDJVVDFoYTJDTi1heVlFRV9fT0RleTBKT3ciLCJhbGciOiJSUzI1NiIsIng1dCI6IllNRUxIVDBndmIwbXhvU0RvWWZvbWpxZmpZVSIsImtpZCI6IllNRUxIVDBndmIwbXhvU0RvWWZvbWpxZmpZVSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC85MGI4ZmFhOC1jYzk1LTQ2MGUtYTYxOC1lZTc3MGJlZTE3NTkvIiwiaWF0IjoxNTg1MTU1MzkzLCJuYmYiOjE1ODUxNTUzOTMsImV4cCI6MTU4NTE1OTI5MywiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFXUUFtLzhQQUFBQWtBeWt4ODRpNjk5eGMwTFNVMkh5UG1UT3VHeHpZY1hod3k1YnZwbTkxRkMyVzZpOUZyYzhETHA0emQ5cEhaVnREK0tCZlN6R1RoMU1pT2xOZVc0RzNoRjFkWE9CVGd1b0lGYW0wd1RHWGh2RWZIaWkvYTJVelU0RXAzTjduWnFZIiwiYWx0c2VjaWQiOiI1OjoxMDAzM0ZGRkE3QzRCQzI4IiwiYW1yIjpbIndpYSJdLCJhcHBfZGlzcGxheW5hbWUiOiJOb2RlQXV0aENvZGUiLCJhcHBpZCI6Ijk5Y2FiNzU5LTJhYWItNDIwYi05MWQ4LTVlM2Q4ZDRmMDYzYiIsImFwcGlkYWNyIjoiMCIsImVtYWlsIjoic2Fnb256YWxAbWljcm9zb2Z0LmNvbSIsImZhbWlseV9uYW1lIjoiR29uemFsZXoiLCJnaXZlbl9uYW1lIjoic2Fnb256YWxAbWljcm9zb2Z0LmNvbSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0Ny8iLCJpcGFkZHIiOiIxMzEuMTA3LjE0Ny4xMjUiLCJuYW1lIjoic2Fnb256YWxAbWljcm9zb2Z0LmNvbSBHb256YWxleiIsIm9pZCI6ImM0ZDNmNjk0LWVmNzQtNDZkYS1hNjU3LWE4NjJhNWJjYzQzOSIsInBsYXRmIjoiMyIsInB1aWQiOiIxMDAzMjAwMDM1NUQwNkExIiwic2NwIjoib3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkIGVtYWlsIiwic2lnbmluX3N0YXRlIjpbImttc2kiXSwic3ViIjoiLTZBOHp3OW1rbEtuUVIxSldvTGZyWGk5ckRFcjBod1hBbzhnSTlCQnBINCIsInRpZCI6IjkwYjhmYWE4LWNjOTUtNDYwZS1hNjE4LWVlNzcwYmVlMTc1OSIsInVuaXF1ZV9uYW1lIjoic2Fnb256YWxAbWljcm9zb2Z0LmNvbSIsInV0aSI6Ikhfc0lubDRTcjAyY196NmphaGlhQUEiLCJ2ZXIiOiIxLjAiLCJ3aWRzIjpbIjYyZTkwMzk0LTY5ZjUtNDIzNy05MTkwLTAxMjE3NzE0NWUxMCJdLCJ4bXNfc3QiOnsic3ViIjoienh3QTlOMXBFM0pVekwtWUlDTmxoZG9TYTVNbWNveE5tVTk4X1N0OUliMCJ9LCJ4bXNfdGNkdCI6MTU0NTUyMDc2OH0.ZGUvk5G6IvtUVFFFqldzJrsJLlxePaV6FwMNAm6MPqtBO3tSTmErCvg3KEEUnuh4WowDgOJVACTvtlFn6infvdIQdaCK2THZvmpCzHvFX2x7yD3H1KkD23ylmETIX4YWDfVbzjm5coSOzdhjX7-G7KBHQH6DDpCNX3mR7kBxRrcYZvOzBEZZQnDb77cmssUT-ZaImprDlgFlCe4355LjmYT8GruMzhHsC_Yb9gspkl0Tl0rLmJ95tS7xvQtTw2tyQ-AGDmxKaIvK88RmS5RCAlo0aH1vy8rsQZ8dmygyn4h9n-0afJ_MBdfwGlP4Q6hO_Buf8ydZHuRLTn7EbXrfRg",
        "refresh_token": "0.ASgAqPq4kJXMDkamGO53C-4XWVm3ypmrKgtCkdhePY1PBjsoAJg.AQABAAAAAAAm-06blBE1TpVMil8KPQ41wKTIQA_xfFsGu4Kcj8Vl_xwPdc9zNkAWI9UC-ODdtiCsVcFov0tEWrmd3fsbiL12B8HhRpahiit6Ee81RH0Z1SGe7yOr5wg8bcFYbcNGQHKwtleRoe5Ti-trn2oirb8VSpuaoBU791iwwCBzyjFH7rRJosRRAxdBSw9jNcNYc2VE6zc8Dd_1svKWpX5lfk24A_oUQ8Ghh_Hp-471qiiak7_qF3bqoAnFQ56HsMeCWz9LMPEVUt1pXi3-rzepM77ykJ157tJic1wO9LyHEhx0Xc3WHakAzE_VK075PqRMraQiYrR3k9XQbTv_7ezPvXD_f1GibIdyoRr5-cnqYKO8t0nZFksWei0Bfgo-bQT1u3bUZcnDn26E7zOKxighnwUnuob-RkeGNsay8Ac2UDMyxuVzMaR1Al84Cchb8_0Yte_MtkyUMG92PT0ShiM3EFkZHT30KaWZdMZGrEFsA_PGeEOHYZYV9rycPtZm9zH3ydlm7ruwlnOiEmXrh-VqprHpzoGj-HSO4PXXvNrMrXHTlAhuCtSc15leMTwI8aqrogAtYA-zUnMCiS-Atm6fG4wvW2_aO5Lp1FjI3rQT-OO_JWW27wMNocCYS_7oQB6A4vW2gWsVBMJU2frZ9EwmaApnUOazCQ-6Mtt7KX8uCekBftdrYAURBiMbrdzZEzyCLnarKk4j8dVM9LiGm0mWH-wN37xx_IH0HcZKkwtAskWROzc0yXC_6Du_IZG-Qo3sWsgMzm9G9iNjunvLo-ArTCPgfXWSahqrO-J4QMlmeMeZNn9yNFIqUDPirtU4lZJIoCBURr-3WW4bSxE1KWkH6DFP2vz9KjXEIrvwG1ElAmpEnxwn6ECOb24OYO6bdprwEHhExGDRwp8upPzpQxY9sBPMu0pcvej3my7BdvAJPFn2xCBnSiqrZ4XUs-noNdsyV7IlTpcUXcc4K7sgUPB4DH0Is5qvTRbK1n2MG4-YtVODrMX2Me68TYyEtlOy8l0OFaD4ytij3SrVrncPfZGomxfOhRuzXADOMo6QCDZKEKmArV60lhO0QSYaqw92y8DQLntrJtrAFPIzk_M2CU55Tm9opZAQIBJFXMdia_J-o83t9iAA",
        "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IllNRUxIVDBndmIwbXhvU0RvWWZvbWpxZmpZVSJ9.eyJhdWQiOiI5OWNhYjc1OS0yYWFiLTQyMGItOTFkOC01ZTNkOGQ0ZjA2M2IiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTBiOGZhYTgtY2M5NS00NjBlLWE2MTgtZWU3NzBiZWUxNzU5L3YyLjAiLCJpYXQiOjE1ODUxNTUzOTMsIm5iZiI6MTU4NTE1NTM5MywiZXhwIjoxNTg1MTU5MjkzLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwibmFtZSI6InNhZ29uemFsQG1pY3Jvc29mdC5jb20gR29uemFsZXoiLCJvaWQiOiJjNGQzZjY5NC1lZjc0LTQ2ZGEtYTY1Ny1hODYyYTViY2M0MzkiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzYWdvbnphbEBtaWNyb3NvZnQuY29tIiwic3ViIjoienh3QTlOMXBFM0pVekwtWUlDTmxoZG9TYTVNbWNveE5tVTk4X1N0OUliMCIsInRpZCI6IjkwYjhmYWE4LWNjOTUtNDYwZS1hNjE4LWVlNzcwYmVlMTc1OSIsInV0aSI6Ikhfc0lubDRTcjAyY196NmphaGlhQUEiLCJ2ZXIiOiIyLjAifQ.WliASidSbhPmfnazz0y8JLreOHzecO9EI39DfYv2Vxj_R-WcMcrPgZZvfK_XBV9oTGPGtep3I2U0Etqcd7RNBdnYGFzM3i8IQM247r4K0TpM5n_zfr1n8iROc86uUvduSYUMMCBM_21xsboNnLfNUxbCc2Mp-C-xRfjXxWNHhcJKTSI-BCroFwL6402XLCWNS351QXeq1h_El9vLdf6NpSDhq5IV0CvRn32T-N3VrYKG6TURomfcvqQWeM5vDRv04jqn7HJRzkVGofq4PVExcd-XUzkmoDkKr5X7GxcO0FB-ROLb9PkS6Rvi8HlaGH9EcI5EkHCjLuZ9mV5jpyxRSQ"
    }
};

export const DEVICE_CODE_RESPONSE = {
    status: 200,
    body: {
        "user_code": "FRWQDE7YL",
        "device_code": "FAQABAAEAAAAm-06blBE1TpVMil8KPQ414yBCo3ZKuMDP8Rw0c8_mKXKdJEpKINnjC1jRfwa_uuF-yqKFw100qeiQDNGuRnS8FxCKeWCybjEPf2KoptmHGa3MEL5MXGl9yEDtaMRGBYpJNx_ssI2zYJP1uXqejSj1Kns69bdClF4BZxRpmJ1rcssZuY1-tTLw0vngmHYqRp0gAA",
        "verification_uri": "https://microsoft.com/devicelogin",
        "expires_in": 900,
        "interval": 5,
        "message": "To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code FRWQDE7YL to authenticate.",
    }
};

export const DEVICE_CODE_EXPIRED_RESPONSE = {
    body: {
        "user_code": "FRWQDE7YL",
        "device_code": "FAQABAAEAAAAm-06blBE1TpVMil8KPQ414yBCo3ZKuMDP8Rw0c8_mKXKdJEpKINnjC1jRfwa_uuF-yqKFw100qeiQDNGuRnS8FxCKeWCybjEPf2KoptmHGa3MEL5MXGl9yEDtaMRGBYpJNx_ssI2zYJP1uXqejSj1Kns69bdClF4BZxRpmJ1rcssZuY1-tTLw0vngmHYqRp0gAA",
        "verification_uri": "https://microsoft.com/devicelogin",
        "expires_in": 0,
        "interval": 5,
        "message": "To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code FRWQDE7YL to authenticate.",
    }
};

export const AUTHORIZATION_PENDING_RESPONSE = {
    body : {
        error: 'authorization_pending',
        error_description: 'AADSTS70016: OAuth 2.0 device flow error. Authorization is pending. Continue polling.' +
            'Trace ID: 01707a0c-640b-4049-8cbb-ee2304dc0700' +
            'Correlation ID: 78b0fdfc-dd0e-4dfb-b13a-d316333783f6' +
            'Timestamp: 2020-03-26 22:54:14Z',
        error_codes: [ 70016 ],
        timestamp: '2020-03-26 22:54:14Z',
        trace_id: '01707a0c-640b-4049-8cbb-ee2304dc0700',
        correlation_id: '78b0fdfc-dd0e-4dfb-b13a-d316333783f6',
        error_uri: 'https://login.microsoftonline.com/error?code=70016'
    }
};
