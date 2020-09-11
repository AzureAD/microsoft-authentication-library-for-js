import * as Mocha from "mocha";
import { expect } from "chai";
import { AuthCache } from "../src/cache/AuthCache";
import sinon from "sinon";
import { Configuration, UserAgentApplication, AuthenticationParameters, ServerHashParamKeys, AuthError, Account } from "../src";
import { AuthorityFactory } from "../src/authority/AuthorityFactory";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { IdToken } from "../src/IdToken";
import { SSOTypes } from "../src/utils/Constants";
import { TEST_CONFIG, TEST_URIS, TEST_TOKENS, TEST_DATA_CLIENT_INFO } from "./TestConstants";
import { kv, setAuthInstanceStubs, setUtilUnifiedCacheQPStubs } from "./TestUtils";
import { AccessTokenKey } from "../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../src/cache/AccessTokenValue";

let msal: UserAgentApplication;
let cacheStorage: AuthCache;
let accessTokenKey : AccessTokenKey;
let accessTokenValue : AccessTokenValue;
let idTokenKey : AccessTokenKey;
let idToken: AccessTokenValue;
let account : Account;

const setTestCacheItems = () => {
    accessTokenKey = {
        authority: TEST_CONFIG.VALID_AUTHORITY,
        clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
        scopes: "s1",
        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
    };
    accessTokenValue = {
        accessToken: TEST_TOKENS.ACCESSTOKEN,
        idToken: TEST_TOKENS.IDTOKEN_V2,
        expiresIn: "150000000000000",
        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
    };
    account = {
        accountIdentifier: "1234",
        environment: "js",
        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
        idToken: new IdToken(TEST_TOKENS.IDTOKEN_V2).claims,
        idTokenClaims: new IdToken(TEST_TOKENS.IDTOKEN_V2).claims,
        name: "Abe Lincoln",
        sid: "123451435",
        userName: "AbeLi@microsoft.com"
    };

    idTokenKey = {
        authority: TEST_CONFIG.VALID_AUTHORITY,
        clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
        scopes: undefined,
        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
    }

    idToken = {
        accessToken: null,
        idToken: TEST_TOKENS.IDTOKEN_V2,
        expiresIn: "150000000000000",
        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
    };
}

describe("UserAgentApplication - AcquireTokenSilent", () => {
    beforeEach(() => {
        cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
        const config: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                redirectUri: TEST_URIS.TEST_REDIR_URI
            }
        };
        msal = new UserAgentApplication(config);
        setAuthInstanceStubs(msal);
        setTestCacheItems();
    });

    afterEach(function() {
        cacheStorage.clear();
        sinon.restore();
    });

    it("tests getCachedToken when authority is not passed and single accessToken is present in the cache for a set of scopes", function (done) {
        const tokenRequest : AuthenticationParameters = {
            scopes: ["S1"],
            account: account
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
        
        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            expect(response.idToken.rawIdToken).to.equal(TEST_TOKENS.IDTOKEN_V2);
            expect(response.idTokenClaims).to.be.deep.eq(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
            expect(response.accessToken).to.be.deep.eq(TEST_TOKENS.ACCESSTOKEN);
            expect(response.account).to.be.eq(account);
            expect(response.scopes).to.be.deep.eq(["s1"]);
            expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
            done();
        }).catch(function(err) {
            // Won't happen
            console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
        });
    });

    it("tests getCachedToken when authority is not passed and multiple accessTokens are present in the cache for a set of scopes", function (done) {
        const tokenRequest : AuthenticationParameters = {
            scopes: ["S1"],
            account: account
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.scopes = "S1 S2";
        accessTokenKey.authority = TEST_CONFIG.ALTERNATE_VALID_AUTHORITY;
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            // Won't happen
            console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
        }).catch(function(err: AuthError) {
            expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleMatchingTokens.code);
            expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleMatchingTokens.desc);
            expect(err.message).to.contain(ClientAuthErrorMessage.multipleMatchingTokens.desc);
            expect(err.name).to.equal("ClientAuthError");
            expect(err.stack).to.include("UserAgentApplication.acquireTokenSilent.spec.ts");
            done();
        });
    });

    it("tests getCachedToken without sending authority when no matching accesstoken is found and multiple authorities exist", function (done) {
        const tokenRequest : AuthenticationParameters = {
            scopes: ["S3"],
            account: account
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.scopes = "S2";
        accessTokenKey.authority = TEST_CONFIG.ALTERNATE_VALID_AUTHORITY;
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            // Won't happen
            console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
        }).catch(function(err: AuthError) {
            expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleCacheAuthorities.code);
            expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleCacheAuthorities.desc);
            expect(err.message).to.contain(ClientAuthErrorMessage.multipleCacheAuthorities.desc);
            expect(err.name).to.equal("ClientAuthError");
            expect(err.stack).to.include("UserAgentApplication.acquireTokenSilent.spec.ts");
            done();
        });
    });

    it("tests getCachedToken when common authority is passed and single matching accessToken is found", function (done) {
        const tokenRequest : AuthenticationParameters = {
            authority: TEST_CONFIG.VALID_AUTHORITY,
            scopes: ["S1"],
            account: account
        };
        const tokenRequestAlternate : AuthenticationParameters = {
            authority: TEST_CONFIG.ALTERNATE_VALID_AUTHORITY,
            scopes: ["S1"],
            account: account
        };
        
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        accessTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "common/";
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
        accessTokenValue.accessToken = "accessTokenAlternate";
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
        idTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            expect(response.scopes).to.be.deep.eq(["s1"]);
            expect(response.account).to.be.eq(account);
            expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
            expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
            expect(response.accessToken).to.eql(TEST_TOKENS.ACCESSTOKEN);
            expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
        }).catch(function(err: AuthError) {
            // Won't happen
            console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
        });
        
        msal.acquireTokenSilent(tokenRequestAlternate).then(function(response) {
            expect(response.scopes).to.be.deep.eq(["s1"]);
            expect(response.account).to.be.eq(account);
            expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
            expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
            expect(response.accessToken).to.include("accessTokenAlternate");
            expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
            done();
        }).catch(function(err: AuthError) {
            // Won't happen
            console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
        });
        
    });

    it("tests getCachedToken when organizations authority is passed and single matching accessToken is found", function (done) {
        
        const tokenRequest : AuthenticationParameters = {
            authority: TEST_URIS.DEFAULT_INSTANCE + "organizations/",
            scopes: ["S1"],
            account: account
        };
        const tokenRequestAlternate : AuthenticationParameters = {
            authority: TEST_URIS.ALTERNATE_INSTANCE + "organizations/",
            scopes: ["S1"],
            account: account
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        accessTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "organizations/";
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

        accessTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "organizations/";
        accessTokenValue.accessToken = "accessTokenAlternate";
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        
        idTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "organizations/";
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
        idTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "organizations/";
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            expect(response.scopes).to.be.deep.eq(["s1"]);
            expect(response.account).to.be.eq(account);
            expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
            expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
            expect(response.accessToken).to.include(TEST_TOKENS.ACCESSTOKEN);
            expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
        }).catch(function(err: AuthError) {
            // Won't happen
            console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
        });
        msal.acquireTokenSilent(tokenRequestAlternate).then(function(response) {
            expect(response.scopes).to.be.deep.eq(["s1"]);
            expect(response.account).to.be.eq(account);
            expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
            expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
            expect(response.accessToken).to.include("accessTokenAlternate");
            expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
            done();
        }).catch(function(err: AuthError) {
            // Won't happen
            console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
        });
    });

    it("tests getCachedToken when tenant authority is passed and single matching accessToken is found", function (done) {
        
        const tokenRequest : AuthenticationParameters = {
            authority: TEST_URIS.DEFAULT_INSTANCE + "common/",
            scopes: ["S1"],
            account: account
        };
        const tokenRequestAlternate : AuthenticationParameters = {
            authority: TEST_URIS.ALTERNATE_INSTANCE + "common/",
            scopes: ["S1"],
            account: account
        };
        
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        accessTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "common/";
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
        accessTokenValue.accessToken = "accessTokenAlternate";
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
        idTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            expect(response.scopes).to.be.deep.eq(["s1"]);
            expect(response.account).to.be.eq(account);
            expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
            expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
            expect(response.accessToken).to.include(TEST_TOKENS.ACCESSTOKEN);
            expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
        }).catch(function(err: AuthError) {
            // Won't happen
            console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
        });
        msal.acquireTokenSilent(tokenRequestAlternate).then(function(response) {
            expect(response.scopes).to.be.deep.eq(["s1"]);
            expect(response.account).to.be.eq(account);
            expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
            expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
            expect(response.accessToken).to.include("accessTokenAlternate");
            expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
            done();
        }).catch(function(err: AuthError) {
            // Won't happen
            console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
        });
    });

    it("tests getCachedToken when authority is passed and multiple matching accessTokens are found", function (done) {
        const tokenRequest : AuthenticationParameters = {
            authority: TEST_CONFIG.VALID_AUTHORITY,
            scopes: ["S1"],
            account: account
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);
        accessTokenKey.authority = accessTokenKey.authority;
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.scopes = "S1 S2";
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
        }).catch(function(err: AuthError) {
            expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleMatchingTokens.code);
            expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleMatchingTokens.desc);
            expect(err.message).to.contain(ClientAuthErrorMessage.multipleMatchingTokens.desc);
            expect(err.name).to.equal("ClientAuthError");
            expect(err.stack).to.include("UserAgentApplication.acquireTokenSilent.spec.ts");
            done();
        });
    });

    it("tests getCachedToken when authority is passed and no matching accessToken is found", function (done) {
        const tokenRequest : AuthenticationParameters = {
            authority: TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.MSAL_TENANT_ID,
            scopes: ["S1"],
            account: account
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        sinon.stub(AuthorityFactory, "saveMetadataFromNetwork").returns(null);
        // TODO: Stub renewToken instead of spying.
        const renewTokenSpy = sinon.spy(msal, <any>"renewToken");

        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            // Won't happen - we are not testing response here
            console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
        }).catch(function(err: AuthError) {
            // Failure will be caught here since the tests are being run within the stub.
            expect(err).to.be.instanceOf(AuthError);
            expect(renewTokenSpy.calledOnce).to.be.true;
            done();
        });
    });

    it("tests getCachedToken when authority is passed and single matching accessToken is found which is expired", function (done) {
        const tokenRequest : AuthenticationParameters = {
            authority: TEST_CONFIG.ALTERNATE_VALID_AUTHORITY,
            scopes: ["S1"],
            account: account
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
            return new Promise<void>(() => {
                expect(cacheStorage.getItem(JSON.stringify(accessTokenKey))).to.be.null;
                expect(url).to.include(TEST_CONFIG.ALTERNATE_VALID_AUTHORITY + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile");
                expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include("&state");
                expect(url).to.include("&client_info=1");
                done();
            });
        });

        accessTokenValue.expiresIn = "1300";
        accessTokenKey.authority = TEST_CONFIG.ALTERNATE_VALID_AUTHORITY;
        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            // Won't happen - we are not testing response here
            console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
        }).catch(function(err: AuthError) {
            // Failure will be caught here since the tests are being run within the stub.
            expect(err).to.be.instanceOf(AuthError);
        });
    });

    it("tests getCachedToken is skipped when claims are passed in", function (done) {
        const claimsRequestObj: any = {
            "accessToken": {
                "test": null
            }
        };
        const tokenRequest : AuthenticationParameters = {
            authority: TEST_CONFIG.VALID_AUTHORITY,
            scopes: ["S1"],
            account: account,
            claimsRequest: JSON.stringify(claimsRequestObj)
        };
        const params: kv = {  };
        params[SSOTypes.SID] = account.sid;
        setUtilUnifiedCacheQPStubs(params);

        const cacheCallSpy = sinon.spy(msal, <any>"getCachedToken");

        sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
            return new Promise<void>(() => {
                expect(cacheCallSpy.notCalled).to.be.true;
                expect(url).to.include(TEST_CONFIG.VALID_AUTHORITY + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile");
                expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include("&state");
                expect(url).to.include("&client_info=1");
                expect(url).to.include("&claims=" + encodeURIComponent(tokenRequest.claimsRequest));
                done();
            });
        });

        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            // Won't happen - we are not testing response here
            console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
        }).catch(function(err: AuthError) {
            // Failure will be caught here since the tests are being run within the stub.
            expect(err).to.be.instanceOf(AuthError);
        });
    });

    it("tests getCachedToken is skipped when force is set true", function (done) {

        const tokenRequest : AuthenticationParameters = {
            authority: TEST_CONFIG.VALID_AUTHORITY,
            scopes: ["S1"],
            account: account,
            forceRefresh: true
        };

        setUtilUnifiedCacheQPStubs({
            [SSOTypes.SID]: account.sid
        });
        const cacheCallSpy = sinon.spy(msal, <any>"getCachedToken");

        sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
            return new Promise<void>(() => {
                expect(cacheCallSpy.notCalled).to.be.true;
                expect(url).to.include(TEST_CONFIG.VALID_AUTHORITY + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile");
                expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include("&state");
                expect(url).to.include("&client_info=1");
                done();
            });
        });

        cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

        msal.acquireTokenSilent(tokenRequest).then(function(response) {
            // Won't happen - we are not testing response here
            throw `Shouldn't have response here. Data: ${JSON.stringify(response)}`;
        }).catch(done);
    });
})