import {UserAgentApplication} from '../src/index';
import { Constants, ErrorCodes, ErrorDescription} from '../src/Constants';
import {Authority} from "../src/Authority";
import {AuthenticationRequestParameters} from "../src/AuthenticationRequestParameters";
import {AuthorityFactory} from "../src/AuthorityFactory";

describe('Msal', function (): any {
    let window: any;
    let msal: any;
    var mathMock = {
        random: function (): any {
            return 0.2;
        },
        round: function (val: any): any {
            return 1000;
        }
    };

    var mockFrames = {};

    var documentMock = {
        getElementById: function (frameId: any) {
            if (!mockFrames[frameId]) {
                mockFrames[frameId] = { src: 'start' };
            }
            return mockFrames[frameId];
        }
    };

    var RESOURCE_DELIMETER = '|';
    var DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    var TEST_REDIR_URI = "https://localhost:8081/redirect.html"
    var TENANT = 'common';
    var validAuthority = DEFAULT_INSTANCE + TENANT;

    var storageFake = function () {
        var store = {};

        var accessTokenCacheItem = {
            key: {
                authority: "",
                clientId: "",
                scopes: "",
                userIdentifer: ""
            },
            value: {
                accessToken: "",
                idToken: "",
                expiresIn: "",
                clientInfo: ""
            }
        }

        return {
            getItem: function (key: any, storeAuthStateInCookie?: boolean) {
                if (storeAuthStateInCookie) {
                    return this.getItemCookie(key);
                }
                return store[key];
            },
            setItem: function (key: any, value: any, storeAuthStateInCookie?: boolean) {
                if (typeof value != 'undefined') {
                    store[key] = value;
                }
                if (storeAuthStateInCookie) {
                    this.setItemCookie(key, value);
                }

            },
            removeItem: function (key: any) {
                if (typeof store[key] != 'undefined') {
                    delete store[key];
                }
            },
            clear: function () {
                store = {};
            },
            storeVerify: function () {
                return store;
            },
            getAllAccessTokens: function (clientId: any, userIdentifier: any) {
                var results = [];
                for (var key in store) {
                    if (store.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(userIdentifier)) {
                            let value = this.getItem(key);
                            if (value) {
                                let accessTokenCacheItem = <any>{};
                                accessTokenCacheItem.key = JSON.parse(key);
                                accessTokenCacheItem.value = JSON.parse(value);
                                results.push(accessTokenCacheItem);
                            }
                        }
                    }
                }
                return results;
            },

            setItemCookie(cName: string, cValue: string, expires?: number): void {
                var cookieStr = cName + "=" + cValue + ";";
                if (expires) {
                    var expireTime = this.setExpirationCookie(expires);
                    cookieStr += "expires=" + expireTime + ";";
                }

                document.cookie = cookieStr;
            },

            getItemCookie(cName: string): string {
                var name = cName + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return "";
            },

            removeAcquireTokenEntries: function () {
                return;
            },

            setExpirationCookie(cookieLife: number): string {
                var today = new Date();
                var expr = new Date(today.getTime() + cookieLife * 24 * 60 * 60 * 1000);
                return expr.toUTCString();
            },

            clearCookie(): void {
                this.setItemCookie(Constants.nonceIdToken, '', -1);
                this.setItemCookie(Constants.stateLogin, '', -1);
                this.setItemCookie(Constants.loginRequest, '', -1);
            }
        };
    }();

    beforeEach(function () {
        // one item in cache
        storageFake.clear();
        var secondsNow = mathMock.round(0);
        let $window: any = {
            location: {
                hash: '#hash',
                href: 'href',
                replace: function (val: any) {
                }
            },
            localStorage: {},
            sessionStorage: {},
            atob: atob,
            innerWidth: 100,
            innerHeight: 100,
        };
        $window.localStorage = storageFake;
        $window.sessionStorage = storageFake;
        // Init
        let global = <any>{};
        global.window = $window;
        global.localStorage = storageFake;
        global.sessionStorage = storageFake;
        global.document = documentMock;
        global.Math = mathMock;

        msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDes, token, error) {
        });
        msal._user = null;
        msal._renewStates = [];
        msal._activeRenewals = {};
        msal._cacheStorage = storageFake;

        jasmine.Ajax.install();

        const validOpenIdConfigurationResponse = `{"authorization_endpoint":"${validAuthority}/oauth2/v2.0/authorize","token_endpoint":"https://token_endpoint","issuer":"https://fakeIssuer", "end_session_endpoint":"https://end_session_endpoint"}`;

        jasmine.Ajax.stubRequest(/.*openid-configuration/i).andReturn({
            responseText: validOpenIdConfigurationResponse
        });
        jasmine.Ajax.stubRequest(/.*discovery\/instance/i).andReturn({
            responseText: '{"tenant_discovery_endpoint":"https://tenant_discovery_endpoint/openid-configuration"}'
        });
    });

    afterEach(function () {
        jasmine.Ajax.uninstall();
    });

    it('navigates user to login and prompt parameter is not passed by default', (done) => {
        expect(msal.getRedirectUri()).toBe(global.window.location.href);
        msal.promptUser = function (args: string) {
            expect(args).toContain(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(args).toContain('&client_id=' + msal.clientId);
            expect(args).toContain('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
            expect(args).toContain('&state');
            expect(args).toContain('&client_info=1');
            expect(args).not.toContain(Constants.prompt_select_account);
            expect(args).not.toContain(Constants.prompt_none);
            done();
        };

        msal.loginRedirect();

    });

    it('navigates user to login and prompt parameter is passed as extraQueryParameter', (done) => {
        expect(msal.getRedirectUri()).toBe(global.window.location.href);
        msal.promptUser = function (args: string) {
            expect(args).toContain(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(args).toContain('&client_id=' + msal.clientId);
            expect(args).toContain('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
            expect(args).toContain('&state');
            expect(args).toContain('&client_info=1');
            expect(args).toContain(Constants.prompt_select_account);
            expect(args).not.toContain(Constants.prompt_none);
            done();
        };

        msal.loginRedirect(null, Constants.prompt_select_account);
    });

    it('navigates user to login and prompt parameter is passed as extraQueryParameter', (done) => {
        expect(msal.getRedirectUri()).toBe(global.window.location.href);
        msal.promptUser = function (args: string) {
            expect(args).toContain(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(args).toContain('&client_id=' + msal.clientId);
            expect(args).toContain('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
            expect(args).toContain('&state');
            expect(args).toContain('&client_info=1');
            expect(args).not.toContain(Constants.prompt_select_account);
            expect(args).toContain(Constants.prompt_none);
            done();
        };

        msal.loginRedirect(null, Constants.prompt_none);
    });

    it('navigates user to redirectURI passed as extraQueryParameter', (done) => {
        msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDes, token, error) {
                }, { redirectUri: TEST_REDIR_URI });
        msal._user = null;
        msal._renewStates = [];
        msal._activeRenewals = {};
        msal._cacheStorage = storageFake;
        expect(msal._redirectUri).toBe(TEST_REDIR_URI);
        msal.promptUser = function (args: string) {
            expect(args).toContain(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(args).toContain('&client_id=' + msal.clientId);
            expect(args).toContain('&redirect_uri=' + encodeURIComponent(msal._redirectUri));
            expect(args).toContain('&state');
            expect(args).toContain('&client_info=1');
            done();
        };

        msal.loginRedirect();
    });

    it('uses current location.href as returnUri by default, even if location changed after UserAgentApplication was instantiated', (done) => {
        history.pushState(null, null, '/new_pushstate_uri');
        msal.promptUser = function (args: string) {
            expect(args).toContain('&redirect_uri=' + encodeURIComponent('http://localhost:8080/new_pushstate_uri'));
            done();
        };
        msal.loginRedirect();
    });

    it('tests getCachedToken when authority is not passed and single accessToken is present in the cache for a set of scopes', function () {
        var accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "150000000000000",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ scopes: ['S1'] }, user);
        expect(cacheResult.token).toBe('accessToken');
        expect(cacheResult.errorDesc).toBe(null);
        expect(cacheResult.error).toBe(null);
        storageFake.clear();
    });

    it('tests getCachedToken when authority is not passed and multiple accessTokens are present in the cache for the same set of scopes', function () {
        var accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "150000000000000",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.scopes = "S1 S2";
        accessTokenKey.authority = "authority2";
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ scopes: ["S1"] }, user);
        expect(cacheResult.errorDesc).toBe("The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements like authority");
        expect(cacheResult.token).toBe(null);
        expect(cacheResult.error).toBe("multiple_matching_tokens_detected");
        storageFake.clear();
    });

    it('tests getCachedToken without sending authority when no matching accesstoken is found and multiple authorities exist', function () {
        var accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "150000000000000",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.scopes = 'S2';
        accessTokenKey.authority = 'authority2';
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ scopes: ['S3'] }, user);
        expect(cacheResult.errorDesc).toBe("Multiple authorities found in the cache. Pass authority in the API overload.");
        expect(cacheResult.token).toBe(null);
        expect(cacheResult.error).toBe("multiple_matching_tokens_detected");
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and no matching accessToken is found', function () {
        var accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "150000000000000",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ authority: "authority2", scopes: ['S1'] }, user);
        expect(cacheResult).toBe(null);
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and single matching accessToken is found', function () {
        var accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "150000000000000",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.authority = "authority2";
        accessTokenValue.accessToken = "accessToken2";
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult1 = msal.getCachedToken({ authority: validAuthority, scopes: ['S1'] }, user);
        expect(cacheResult1.errorDesc).toBe(null);
        expect(cacheResult1.token).toBe('accessToken1');
        expect(cacheResult1.error).toBe(null);
        let cacheResult2 = msal.getCachedToken({ authority: "authority2", scopes: ['S1'] }, user);
        expect(cacheResult2.errorDesc).toBe(null);
        expect(cacheResult2.token).toBe('accessToken2');
        expect(cacheResult2.error).toBe(null);
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and multiple matching accessTokens are found', function () {
        var accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "150000000000000",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.authority = validAuthority;
        accessTokenKey.scopes = "S1 S2";
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ authority: validAuthority, scopes: ['S1'] }, user);
        expect(cacheResult.errorDesc).toBe("The cache contains multiple tokens satisfying the requirements.Call AcquireToken again providing more requirements like authority");
        expect(cacheResult.token).toBe(null);
        expect(cacheResult.error).toBe("multiple_matching_tokens_detected");
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and single matching accessToken is found which is expired', function () {
        var accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "1300",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ authority: validAuthority, scopes: ['S1'] }, user);
        expect(cacheResult).toBe(null);
        expect(storageFake.getItem(JSON.stringify(accessTokenKey))).toBe(undefined);
        storageFake.clear();
    });

    it('tests saveTokenForHash in case of error', function () {
        var requestInfo = {
            valid: false,
            parameters: { 'error_description': 'error description', 'error': 'invalid' },
            stateMatch: false,
            stateResponse: '',
            requestType: 'unknown'
        };

        var _cacheStorage = msal._cacheStorage.removeAcquireTokenEntries;
        msal._cacheStorage.removeAcquireTokenEntries = function () {
            return;
        }
        msal.saveTokenFromHash(requestInfo);
        msal._cacheStorage.removeAcquireTokenEntries = _cacheStorage;
        expect(storageFake.getItem(Constants.msalError)).toBe('invalid');
        expect(storageFake.getItem(Constants.msalErrorDescription)).toBe('error description');
    });

    it('tests if login function exits with error if loginInProgress is true and callback is called with loginProgress error', function () {
        msal._loginInProgress = true;
        var errDesc = '', token = '', err = '', tokenType = '';
        var callback = function (valErrDesc:string, valToken:string, valErr:string, valTokenType:string) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
            tokenType = valTokenType;
        };
        msal._tokenReceivedCallback = callback;
        msal.loginRedirect();
        expect(errDesc).toBe(ErrorDescription.loginProgressError);
        expect(err).toBe(ErrorCodes.loginProgressError);
        expect(token).toBe(null);
        expect(tokenType).toBe(Constants.idToken);
        msal._loginInProgress = false;
    });

    it('tests if loginRedirect fails with error if scopes is passed as an empty array', function () {
        var errDesc = '', token = '', err = '', tokenType = '';
        var callback = function (valErrDesc: string, valToken: string, valErr: string, valTokenType: string) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
            tokenType = valTokenType;
        };
        msal._tokenReceivedCallback = callback;
        msal.loginRedirect([]);
        expect(errDesc).toBe(ErrorDescription.inputScopesError);
        expect(err).toBe(ErrorCodes.inputScopesError);
        expect(token).toBe(null);
        expect(tokenType).toBe(Constants.idToken);
    });

    it('tests if loginRedirect fails with error if clientID is not passed as a single scope in the scopes array', function () {
        var errDesc = '', token = '', err = '', tokenType = '';
        var callback = function (valErrDesc: string, valToken: string, valErr: string, valTokenType: string) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
            tokenType = valTokenType;
        };
        msal._tokenReceivedCallback = callback;
        msal.loginRedirect([msal.clientId,'123']);
        expect(errDesc).toBe(ErrorDescription.inputScopesError);
        expect(err).toBe(ErrorCodes.inputScopesError);
        expect(token).toBe(null);
        expect(tokenType).toBe(Constants.idToken);
    });

    it('tests if openid and profile scopes are removed from the input array if explicitly passed to the filterScopes function', function () {
        var scopes = ['openid', 'profile'];
        scopes = msal.filterScopes(scopes);
        expect(scopes.length).toEqual(0);
    });

    it('tests if hint parameters get added when user object is passed to the function', function () {
        var user = {
            userIdentifier: '1234.5678',
            displayableId:'some_id'
        }
        var urlNavigate = '';
        urlNavigate = msal.addHintParameters(urlNavigate, user);
        expect(urlNavigate).toContain("login_hint");
        expect(urlNavigate).toContain("login_req");
        expect(urlNavigate).toContain("domain_req");
        expect(urlNavigate).toContain("domain_hint");
    });

    it('tests urlContainsQueryStringParameter functionality', function () {
        var url1 = 'https://login.onmicrosoft.com?prompt=none&client_id=12345';
        expect(msal.urlContainsQueryStringParameter('prompt', url1)).toBe(true);
        expect(msal.urlContainsQueryStringParameter('client_id', url1)).toBe(true);
        expect(msal.urlContainsQueryStringParameter('login_hint', url1)).toBe(false);
    });

    it('clears cache before logout', function () {
        spyOn(msal, 'clearCache');
        spyOn(msal, 'promptUser');
        msal.logout();
        expect(msal.clearCache).toHaveBeenCalled();
        expect(msal.promptUser).toHaveBeenCalled();
    });

    it('checks if postLogoutRedirectUri is added to logout url if provided in the config ', function () {
        var _clearCache = msal.clearCache;
        msal.clearCache = function () {
            return;
        }
        msal._postLogoutredirectUri = 'https://contoso.com/logout';
        spyOn(msal, 'promptUser');
        msal.logout();
        expect(msal.promptUser).toHaveBeenCalledWith(msal.authority + '/oauth2/v2.0/logout?post_logout_redirect_uri=https%3A%2F%2Fcontoso.com%2Flogout');
        msal.clearCache = _clearCache;
    });

    it('checks if postLogoutRedirectUri is added to logout url if provided in the config as a function', function () {
        var _clearCache = msal.clearCache;
        msal.clearCache = function () {
            return;
        }
        msal._postLogoutredirectUri = () => 'https://contoso.com/logoutfn';
        spyOn(msal, 'promptUser');
        msal.logout();
        expect(msal.promptUser).toHaveBeenCalledWith(msal.authority + '/oauth2/v2.0/logout?post_logout_redirect_uri=https%3A%2F%2Fcontoso.com%2Flogoutfn');
        msal.clearCache = _clearCache;
    });

    it('is callback if has error or access_token or id_token', function () {
        expect(msal.isCallback('not a callback')).toBe(false);
        expect(msal.isCallback('#error_description=someting_wrong')).toBe(true);
        expect(msal.isCallback('#/error_description=someting_wrong')).toBe(true);
        expect(msal.isCallback('#access_token=token123')).toBe(true);
        expect(msal.isCallback('#id_token=idtoken234')).toBe(true);
    });

    it('gets request info from hash', function () {
        var requestInfo = msal.getRequestInfo('invalid');
        expect(requestInfo.valid).toBe(false);
        requestInfo = msal.getRequestInfo('#error_description=someting_wrong');
        expect(requestInfo.valid).toBe(true);
        expect(requestInfo.stateResponse).toBe('');

        requestInfo = msal.getRequestInfo('#error_description=someting_wrong&state=1232');
        expect(requestInfo.valid).toBe(true);
        expect(requestInfo.stateResponse).toBe('1232');
        expect(requestInfo.stateMatch).toBe(false);
    });

    it('test getUserState with a user passed state', function () {
        var result =msal.getUserState("123465464565|91111");
        expect(result).toEqual("91111")
    });

    it('test getUserState when there is no user state', function () {
        var result =msal.getUserState("123465464565");
        expect(result).toEqual("")
    });

    it('test getUserState when there is no state', function () {
        var result =msal.getUserState("");
        expect(result).toEqual("")
    });

    it('test if authenticateRequestParameter generates state correctly, if state is a number', function () {
        let authenticationRequestParameters: AuthenticationRequestParameters;
        let authority: Authority;
        authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
        authenticationRequestParameters = new AuthenticationRequestParameters(authority, "0813e1d1-ad72-46a9-8665-399bba48c201", ["user.read"], "id_token", "", "12345");
        var result;
        result = authenticationRequestParameters.createNavigationUrlString(["user.read"]);
        expect(decodeURIComponent(result[4])).toContain("12345");
    });

    it('test if authenticateRequestParameter generates state correctly, if state is a url', function () {
        let authenticationRequestParameters: AuthenticationRequestParameters;
        let authority: Authority;
        authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
        authenticationRequestParameters = new AuthenticationRequestParameters(authority, "0813e1d1-ad72-46a9-8665-399bba48c201", ["user.read"], "id_token", "", "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
        var result;
        result = authenticationRequestParameters.createNavigationUrlString(["user.read"]);
        expect(decodeURIComponent(result[4])).toContain("https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
    });

    it('tests if you get the state back in tokenReceived callback, if state is a number', function () {
        spyOn(msal, 'getUserState').and.returnValue("1234");
        msal._loginInProgress = true;
        var errDesc = '', token = '', err = '', tokenType = '', state= '' ;
        var callback = function (valErrDesc:string, valToken:string, valErr:string, valTokenType:string, valState: string) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
            tokenType = valTokenType;
            state= valState;
        };

        msal._tokenReceivedCallback = callback;
        msal.loginRedirect();
        expect(errDesc).toBe(ErrorDescription.loginProgressError);
        expect(err).toBe(ErrorCodes.loginProgressError);
        expect(token).toBe(null);
        expect(tokenType).toBe(Constants.idToken);
        expect(state).toBe('1234');
        msal._loginInProgress = false;
    });

    it('tests if you get the state back in tokenReceived callback, if state is a url', function () {
        spyOn(msal, 'getUserState').and.returnValue("https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
        msal._loginInProgress = true;
        var errDesc = '', token = '', err = '', tokenType = '', state= '' ;
        var callback = function (valErrDesc:string, valToken:string, valErr:string, valTokenType:string, valState: string) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
            tokenType = valTokenType;
            state= valState;
        };

        msal._tokenReceivedCallback = callback;
        msal.loginRedirect();
        expect(errDesc).toBe(ErrorDescription.loginProgressError);
        expect(err).toBe(ErrorCodes.loginProgressError);
        expect(token).toBe(null);
        expect(tokenType).toBe(Constants.idToken);
        expect(state).toBe('https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2');
        msal._loginInProgress = false;
    });

    it('tests that loginStartPage, nonce and state are saved in cookies if enableCookieStorage flag is enables through the msal optional params', function (done) {
        var msalInstance = msal;
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';
        msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDesc, token, error, tokenType) {
            expect(document.cookie).toBe('');
            expect(errorDesc).toBeUndefined();
            expect(error).toBeUndefined();
            expect(token).toBe(mockIdToken);
            expect(tokenType).toBe(Constants.idToken);
        }, { storeAuthStateInCookie: true });
        msal._cacheStorage = storageFake;
        var _promptUser = msal.promptUser;
        msal.promptUser = function () {
            expect(document.cookie).toContain(Constants.stateLogin);
            expect(document.cookie).toContain(Constants.nonceIdToken);
            expect(document.cookie).toContain(Constants.loginRequest);
            var urlHash = '#' + 'id_token=' + mockIdToken + '&state=' + storageFake.getItem(Constants.stateLogin) + '&nonce=' + storageFake.getItem(Constants.nonceIdToken)
            storageFake.setItem(Constants.urlHash, urlHash);
            storageFake.removeItem(Constants.stateLogin);
            storageFake.removeItem(Constants.nonceIdToken);
            storageFake.removeItem(Constants.loginRequest);
            msal.processCallBack(urlHash);
            msal = msalInstance;
            done();
        }
        msal.loginRedirect();
    });

    it('tests cacheLocation functionality sets to localStorage when passed as a parameter', function () {
        var msalInstance = msal;
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';

         msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDesc, token, error, tokenType) {
             expect(document.cookie).toBe('');
             expect(errorDesc).toBeUndefined();
             expect(error).toBeUndefined();
             expect(token).toBe(mockIdToken);
             expect(tokenType).toBe(Constants.idToken);
         }, { cacheLocation: 'localStorage' });

         expect(msal._cacheLocation).toBe('localStorage');
    });

    it('tests cacheLocation functionality defaults to sessionStorage', function () {
        var msalInstance = msal;
        var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';

         msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDesc, token, error, tokenType) {
             expect(document.cookie).toBe('');
             expect(errorDesc).toBeUndefined();
             expect(error).toBeUndefined();
             expect(token).toBe(mockIdToken);
             expect(tokenType).toBe(Constants.idToken);
         });

         expect(msal._cacheLocation).toBe('sessionStorage');
    });
    /**
    it('tests cacheLocation functionality malformed strings throw error', function () {
         var msalInstance = msal;
         var mockIdToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjbGllbnRpZDEyMyIsIm5hbWUiOiJKb2huIERvZSIsInVwbiI6ImpvaG5AZW1haWwuY29tIiwibm9uY2UiOiIxMjM0In0.bpIBG3n1w7Cv3i_JHRGji6Zuc9F5H8jbDV5q3oj0gcw';

         msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDesc, token, error, tokenType) {
             expect(document.cookie).toBe('');
             expect(errorDesc).toBe("Cache Location is not valid.");
             expect(token).toBe(mockIdToken);
             expect(tokenType).toBe(Constants.idToken);
         }, { cacheLocation: 'lclStrge' });
    });
    **/

});

describe('loginPopup functionality', function () {
    var loginPopupPromise:Promise<string>;
    var msal;
    beforeEach(function () {
        msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDes, token, error) {
        });
        spyOn(msal, 'loginPopup').and.callThrough();
        loginPopupPromise = msal.loginPopup([msal.clientId]);
    });

    it('returns a promise', function () {
        expect(loginPopupPromise).toEqual(jasmine.any(Promise));
    });
});

describe('acquireTokenPopup functionality', function () {
    var acquireTokenPopupPromise: Promise<string>;
    var msal;
    beforeEach(function () {
        msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDes, token, error) {
        });
        spyOn(msal, 'acquireTokenPopup').and.callThrough();
        acquireTokenPopupPromise = msal.acquireTokenPopup([msal.clientId]);
        acquireTokenPopupPromise.then(function(accessToken) {
        }, function(error) {
        });
    });

    it('returns a promise', function () {
        expect(acquireTokenPopupPromise).toEqual(jasmine.any(Promise));
    });

});

describe('acquireTokenSilent functionality', function () {
    var acquireTokenSilentPromise: Promise<string>;
    var msal;
    beforeEach(function () {
        msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDes, token, error) {
        });
        spyOn(msal, 'acquireTokenSilent').and.callThrough();
        spyOn(msal, 'loadIframeTimeout').and.callThrough();
        acquireTokenSilentPromise = msal.acquireTokenSilent([msal.clientId]);
        acquireTokenSilentPromise.then(function(accessToken) {
        }, function(error) {
        });
    });


    it('returns a promise', function () {
        expect(acquireTokenSilentPromise).toEqual(jasmine.any(Promise));
    });

});


