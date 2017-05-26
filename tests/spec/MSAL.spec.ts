/// <reference path="../../out/msal.d.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

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
            getItem: function (key: any) {
                return store[key];
            },
            setItem: function (key: any, value: any) {
                if (typeof value != 'undefined') {
                    store[key] = value;
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

        msal = new Msal.UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", {
            tokenReceivedCallback: function (errorDes, token, error) { }
        });
        msal._user = null;
        msal._renewStates = [];
        msal._activeRenewals = {};
        msal._cacheStorage = storageFake;
        Msal.Constants.loadFrameTimeout = 6000;

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

    it('navigates user to login by default', (done) => {
        expect(msal.redirectUri).toBe("http://localhost:8080/context.html");
        msal.promptUser = function (args: string) {
            expect(args).toContain(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(args).toContain('&client_id=' + msal.clientId);
            expect(args).toContain('&redirect_uri=contoso_site');
            expect(args).toContain('&state');
            expect(args).toContain('&redirect_uri=contoso_site');
            expect(args).toContain('&client_info=1');

            done();
        };

        msal.redirectUri = 'contoso_site';
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
});