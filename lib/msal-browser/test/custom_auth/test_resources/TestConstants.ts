/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const TestTokenResponse = {
    ACCESS_TOKEN: "fake-access-token",
    REFRESH_TOKEN: "fake-refresh-token",
    // This is a mock id token with a valid signature (signed by HS265 with a fake secret key), but the claims are not real.
    ID_TOKEN:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiI4ZDljNzYzNS0wOTMzLTRiOTctYjJhZC03YzUzZDkxZGY1ZGEiLCJpc3MiOiJodHRwczovL2QzN2U1NjQ1LTQxNzAtNGNlMC1hNjE4LTFiOTAwOGIxNGU1OC5jaWFtbG9naW4uY29tL2QzN2U1NjQ1LTQxNzAtNGNlMC1hNjE4LTFiOTAwOGIxNGU1OC92Mi4wIiwiaWF0IjoxNzQwMDQ5Mjg4LCJuYmYiOjE3NDAwNDkyODgsImV4cCI6MTc0MDA1MzE4OCwiYWlvIjoiQVdRQW0vOFpBQUFBM1phQmdmWkRhaGhUOGVadThTUzhtUHFxelRIbjk5QjBIMmlUa3NvZW9mbW9pMTIya2ZvaXNqZmVnREVUVTFSczc0TkNUMDlUeUVWWjM0c3NNVnVmaHFDTVRYYjFnTUlLSFBUdEF2MlVBa2p1akZuZCtaZE8iLCJpZHAiOiJtYWlsIiwibmFtZSI6InVua25vd24iLCJvaWQiOiJkOGRjY2VlOC1iOGJjLTQ1MmMtOGJjYy1hNmViOTUzZGI0NTkiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhYmNAdGVzdC5jb20iLCJyaCI6IjEuQWM4QXpYUzVIc1VOcHNmZXdmZWtDZmFKU3huMVUxeFVCTHhzZmV3ZnNmZVBBSTdQQUEuIiwic2lkIjoiZGNiMDQ4NjItZjk1Ni00MzAxLWIzZmMtMGZkMzhmYTViZTdmIiwic3ViIjoiYkh5VlVkUHNmc2Fmc2RmZU16TDdhM1JYdklVbGJlSVVZQVoxMm8iLCJ0aWQiOiJkMzdlNTY0NS00MTcwLTRjZTAtYTYxOC0xYjkwMDhiMTRlNTgiLCJ1dGkiOiJZWDFPREZKX3NlZnVFbUhaZGZodWVKRERCbFFEQUEiLCJ2ZXIiOiIyLjAifQ.M0FBAIMmwwGTGpVbGFEWBy3vUfBEqNdem9MT2L5r39Y",
    CLIENT_INFO:
        "eyJ1aWQiOiI1MTIyZWZiMS1mM2EzLTRhNWQtYjVhZS1jNTQ3NGVhMWM3YmQiLCJ1dGlkIjoiZDM3ZTU2NDUtNDE3MC00Y2UwLWE2MTgtMWI5MDA4YjE0ZTU4In0=",
} as const;

export const TestHomeAccountId =
    "5122efb1-f3a3-4a5d-b5ae-c5474ea1c7bd.d37e5645-4170-4ce0-a618-1b9008b14e58"; // fake homeAccountId
export const TestTenantId = "d37e5645-4170-4ce0-a618-1b9008b14e58"; // fake tenantId
export const TestUsername = "abc@test.com"; // fake username
export const TestLoginHint = "loginHint"; // fake login hint

export const TestAccountDetails = {
    homeAccountId: TestHomeAccountId,
    environment: "spasamples.ciamlogin.com",
    tenantId: TestTenantId,
    username: TestUsername,
    loginHint: TestLoginHint,
    localAccountId: "5122efb1-f3a3-4a5d-b5ae-c5474ea1c7bd", // Must match CLIENT_INFO.uid
    idTokenClaims: {
        tid: TestTenantId,
        oid: "5122efb1-f3a3-4a5d-b5ae-c5474ea1c7bd", // Must match CLIENT_INFO.uid
        preferred_username: TestUsername,
        loginHint: TestLoginHint,
    },
    name: "Test User",
    idToken: TestTokenResponse.ID_TOKEN,
};

// mock response of POST /token endpoint when renew access token
export const TestServerTokenResponse = {
    status: 200,
    token_type: "Bearer",
    scope: "openid profile User.Read email",
    expires_in: 3600,
    access_token: TestTokenResponse.ACCESS_TOKEN,
    refresh_token: TestTokenResponse.REFRESH_TOKEN,
    id_token: TestTokenResponse.ID_TOKEN,
    client_info: TestTokenResponse.CLIENT_INFO,
    correlation_id: "correlation-id",
};

// // mock decoded id token claims
export const TestIdTokenClaims = {
    name: "unknown",
};

export const RenewedTokens = {
    ACCESS_TOKEN: "renewed-access-token",
    REFRESH_TOKEN: "renewed-refresh-token",
};
