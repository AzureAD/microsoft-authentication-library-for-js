import { AccessTokenEntity, AccountEntity, AccountInfo, AuthenticationResult, AuthenticationScheme, BrokerAuthenticationResult, CacheRecord, CredentialType, TokenClaims } from "@azure/msal-common";
import sinon from "sinon";
import { ClientApplication } from "../../../src/app/ClientApplication";
import { BrokerClientApplication } from "../../../src/broker/client/BrokerClientApplication";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, TEST_TOKENS, TEST_TOKEN_LIFETIMES } from "../../utils/StringConstants";

describe("BrokerClientApplication.ts Unit Tests", () => {

    describe("Constructor", () => {

        let broker: BrokerClientApplication;
        beforeEach(() => {
            broker = new BrokerClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {});
        })

        it("extends ClientApplication.ts", () => {
            expect(broker instanceof ClientApplication).toBeTruthy();
        });
    });

    describe("handleRedirectPromise()", () => {
        const testServerTokenResponse = {
            headers: null,
            status: 200,
            body: {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO
            }
        };
        const testIdTokenClaims: TokenClaims = {
            "ver": "2.0",
            "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "name": "Abe Lincoln",
            "preferred_username": "AbeLi@microsoft.com",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
        };
        const testAccount: AccountInfo = {
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: testIdTokenClaims.tid || "",
            username: testIdTokenClaims.preferred_username || ""
        };
        const accessTokenEntity = new AccessTokenEntity();
        accessTokenEntity.homeAccountId = "someUid.someUtid";
        accessTokenEntity.environment = "login.microsoftonline.com";
        accessTokenEntity.realm = "microsoft";
        accessTokenEntity.clientId = "mock_client_id";
        accessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
        accessTokenEntity.target = "scope6 scope7";

        const ac = new AccountEntity();
        ac.homeAccountId = "someUid.someUtid";
        ac.environment = "login.microsoftonline.com";
        ac.realm = "microsoft";
        ac.localAccountId = "object1234";
        ac.username = "Jane Goodman";
        ac.authorityType = "MSSTS";
        ac.clientInfo = "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9";        

        let broker: BrokerClientApplication;
        beforeEach(() => {
            broker = new BrokerClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {});
        })

        afterEach(() => {
            sinon.restore();
        })

        it("returns cachedResponse if tokensToCache is not set", async () => {
            const testTokenResponse: BrokerAuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
                responseThumbprint: `localhost.eyBhdXRob3JpdHk6Imh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb24iLCBjbGllbnRJZDoiMDgxM2UxZDEtYWQ3Mi00NmE5LTg2NjUtMzk5YmJhNDhjMjAxIiwgc2NvcGVzOlsib3BlbmlkIiwicHJvZmlsZSJdIH0=`,
            };
            const handleRedirectPromiseStub = sinon.stub(ClientApplication.prototype, "handleRedirectPromise").callsFake(async (hash): Promise<AuthenticationResult> => {
                return testTokenResponse;
            });
            const resp = await broker.handleRedirectPromise();

            expect(handleRedirectPromiseStub.calledOnce).toBeTruthy();
            expect(resp).toEqual(testTokenResponse);
        });

        it("returns null if tokensToCache is provided", async () => {
            const testTokenResponse: BrokerAuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
                responseThumbprint: `localhost.eyBhdXRob3JpdHk6Imh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb24iLCBjbGllbnRJZDoiMDgxM2UxZDEtYWQ3Mi00NmE5LTg2NjUtMzk5YmJhNDhjMjAxIiwgc2NvcGVzOlsib3BlbmlkIiwicHJvZmlsZSJdIH0=`,
                tokensToCache: new CacheRecord(ac, undefined, accessTokenEntity)
            };
            const handleRedirectPromiseStub = sinon.stub(ClientApplication.prototype, "handleRedirectPromise").callsFake(async (hash): Promise<AuthenticationResult> => {
                return testTokenResponse;
            });
            const resp = await broker.handleRedirectPromise();

            expect(handleRedirectPromiseStub.calledOnce).toBeTruthy();
            expect(resp).toBeNull();
        });
    });
});
