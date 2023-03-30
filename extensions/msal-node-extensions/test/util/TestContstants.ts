import { AccountInfo } from "@azure/msal-common";
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