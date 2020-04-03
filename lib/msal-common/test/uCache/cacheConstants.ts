export const ATValues = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "AccessToken",
    clientId: "mock_client_id",
    secret: "an access token",
    realm: "microsoft",
    target: "scope1 scope2 scope3",
    cachedAt: "1000",
    expiresOn: "4600",
    extendedExpiresOn: "4600",
    refreshOn: "2300",
    tokenType: "Bearer"
};

export const IdTValues = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "IdToken",
    clientId: "mock_client_id",
    secret: "an id token",
    realm: "microsoft"
};

export const RTValues = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "RefreshToken",
    clientId: "mock_client_id",
    secret: "a refresh token"
};

export const RTValuesWithFamilyId = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "RefreshToken",
    clientId: "mock_client_id",
    secret: "a refresh token",
    familyId: "1"
};


export const AccountValues = {
    homeAccountId: "uid.utid",
    environment:  "login.microsoftonline.com",
    realm: "microsoft",
    localAccountId: "randomObjectId",
    username: "test@test.com",
    authorityType: "MSSTS",
    name: "mock name",
    clientInfo: "base64encodedjson",
    lastModificationTime: "1000",
    lastModificationApp: "TestApp"
};

export const AppMetadataValues = {
    clientId: "mock_client_id",
    environment: "login.microsoftonline.com",
    familyId: "1"
}
