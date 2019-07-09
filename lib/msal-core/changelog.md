# 1.0.2
* Fixed broken link in docs for error message and module docs (#731)
* Fix typo in README (#743, #749)
* Update lerna version (#748)
* Fix Interaction_Required error to throw on all interaction_required error types (#753)
* Added a react sample (#727)
* Fix for bug preventing asynchronous acquireTokenSilent calls (#768)

# 1.0.1
* Fixed bug where navigateToLoginRequestURL = false would cause callback to not fire (#696)
* Fixed bug where null request object would cause null pointer exception for state parameter (#698)
* All msal related cache items are deleted on logout (#709)
* Fixed bug where "user cancelled" error in acquireTokenPopup would not throw (#707)
* Logout endpoint now uses the given EndSessionEndpoint from the oauth discovery endpoint response (#716)
* Now uses base64.js instead of window.atob (#712)
* Fixed bug where login_hint was added if sid was already populated. (#700)

# 1.0.0
* Formal release of msal-1.0.0 which includes all the msal-1.0.0-preview.x changes.
* Includes breaking API Changes - please find the details @https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/MSAL.js-1.0.0-preview-api-release

# 1.0.0-preview.5
* Error First Callbacks PR #658
* Claims Request Support PR #664 
* loginInProgress() as a public function #671 
* 'state' moved from config to request, returning the user state if passed stripping the GUID #674 #679 #681 
* cache cleanup of all values (keys cleanup will be done in next release) #675 
* made loading iFrame timeout in silent calls configurable, 'navigateFrameWait' #676 
* readme updated with latest code patterns #672 

# 1.0.0-preview.4
Add dist back into npm package as a valid build artifact

# 1.0.0-preview.3
Add a hook in package.json to build msal js before npm publish to have the libraries up to date

# 1.0.0-preview.2
## Bug Fixes

* Fix for the multiple_authorities issue seen due to non Canonalized authority storage in cache PR #656
* Populate scopes from cache for getCachedToken Response object PR #657.
* ES6 modules are added back into the npm #654

# 1.0.0-preview.1
## Bug Fixes

* Fix dependencies for non typescript environments

# 1.0.0-preview.0
## New Features (Breaking Changes)

As announced earlier @https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/MSAL.js-1.0.0-preview-changes we are excited to announce the preview release.

### Release notes:

#### Configuration
* Initialization of the MSAL JS library – We introduced a ‘Configuration’ object that can be sent through the constructor of UserAgentApplication() class.

##### Configuration datatype :

```javascript
    // make CacheStorage a fixed type to limit it to specific inputs
    type storage = "localStorage" | "sessionStorage";

    // Protocol Support
    export type AuthOptions = {
        clientId: string;
        authority?: string;
        validateAuthority?: boolean;
        redirectUri?: string | (() => string);
        postLogoutRedirectUri?: string | (() => string);
        state?: string;
        navigateToLoginRequestUrl?: boolean;
    };

    // Cache Support
    export type CacheOptions = {
        cacheLocation?: CacheLocation;
        storeAuthStateInCookie?: boolean;
    };

    // Library support
    export type SystemOptions = {
        logger?: Logger;
        loadFrameTimeout?: number;
        tokenRenewalOffsetSeconds?: number;
    };

    // Developer App Environment Support
    export type FrameworkOptions = {
        isAngular?: boolean;
        unprotectedResources?: Array<string>;
        protectedResourceMap?: Map<string, Array<string>>;
    };

    // Configuration Object
    export type Configuration = {
        auth: AuthOptions,
        cache?: CacheOptions,
        system?: SystemOptions,
        framework?: FrameworkOptions
    };
```

##### Example Config object:

```javascript
    var config = {
        auth: {
            clientId: applicationConfig.clientID,
            authority: applicationConfig.authority,
            validateAuthority: true
        },
        cache: {
            cacheLocation: "localStorage",
            storeAuthStateInCookie: true
        },
        system: {
            logger: devLogger
        }
    };
 ```

##### Before (<= 0.2.4)

```javascript
    // initialize the MSAL JS configuration options
    var myMSALObj = new Msal.UserAgentApplication(
        applicationConfig.clientID,
        applicationConfig.authority,
        acquireTokenRedirectCallBack,
        {storeAuthStateInCookie: true, cacheLocation: "localStorage"}
    );
```
##### After (>= 1.0.0-preview.0)

```javascript
    // initialize the configuration object
    var config = {
        auth: {
            clientId: applicationConfig.clientID,
            authority: applicationConfig.authority,
            validateAuthority: true
        },
        cache: {
            cacheLocation: "localStorage",
            storeAuthStateInCookie: true
        }
    };
     
// initialize the MSAL JS with a configuration object
var myMSALObj = new Msal.UserAgentApplication(config);
 
// register redirect call backs : for Success and Error
myMSALObj.handleRedirectCallbacks(acquireTokenRedirectCallBack, acquireTokenErrorRedirectCallBack);
```

#### Request Object

* ‘Request’ object is introduced for all login/accessToken calls, this replaces previous overloading of login/acquireToken calls.
* Users can choose to pass optional parameters to finetune their requests for authentication and authorization.
* 'User' object is now replaced with 'Account' => the public API getUser() is now getAccount() with more enhanced data.

###### Request Object datatype

```javascript
	export type QPDict = {[key: string]: string};

    // Request type
	export type AuthenticationParameters = {
        scopes?: Array<string>;
        extraScopesToConsent?: Array<string>;
        prompt?: string;
        extraQueryParameters?: QPDict;
        claimsRequest?: null;
        authority?: string;
        correlationId?: string;
        account?: Account;
        sid?: string;
        loginHint?: string;
    };

    // Account Class
    export class Account {

        accountIdentifier: string;
        homeAccountIdentifier: string;
        userName: string;
        name: string;
        idToken: Object;
        sid: string;
        environment: string;

        ....
    }
```
##### Before (<= 0.2.4)

```javascript
    // login request
    loginPopup(applicationConfig.graphScopes);

```

##### After (>= 1.0.0-preview.0)

```javascript

    let loginRequest = {
        scopes: applicationConfig.graphScopes
    };

    loginPopup(loginRequest).then(function (loginResponse) {
        //Login Success
    }).catch(function (error) {
        console.log(error);
    });
```

#### Response Object
* ‘Response’ and 'Error' objects are introduced for server responses and app failures
    - For ‘Redirect’ usecases, explicit success and failure call backs should be passed to ‘handleRedirectCallbacks()’.
    - For 'Popup' and 'Silent' usecases,  a promise pattern i.e.,' .then and .catch'  can be used.

###### Response Object datatype

```javascript
	export type AuthResponse = {
		uniqueId: string;
		tenantId: string;
		tokenType: string;
		idToken: IdToken;
		accessToken: string;
		scopes: Array<string>;
		expiresOn: Date;
		account: Account;
		accountState: string;
    };
```

###### Error Object datatype
- Note: Error objects are better classified and messaged with this release. Detailed documentation for Error Handling will be added soon.

```javascript
	export class AuthError extends Error {
		errorCode: string;
		errorMessage: string;
		...
	}
```

##### Before (<= 0.2.4)
```javascript

    // Login using Popup
    function signIn() {
        myMSALObj.loginPopup(applicationConfig.graphScopes).then(function (idToken) { ... }
    }

    // Request for Access Token
    myMSALObj.acquireTokenSilent(applicationConfig.graphScopes).then(function (accessToken) {
        callMSGraph(applicationConfig.graphEndpoint, accessToken, graphAPICallback);
    }, function (error) {
        console.log(error);
        // Call acquireTokenPopup (popup window) in case of acquireTokenSilent failure due to consent or interaction required ONLY
        if (error.indexOf("consent_required") !== -1 || error.indexOf("interaction_required") !== -1 || error.indexOf("login_required") !== -1) {
            myMSALObj.acquireTokenPopup(applicationConfig.graphScopes).then(function (accessToken) {
                callMSGraph(applicationConfig.graphEndpoint, accessToken, graphAPICallback);
            }, function (error) {
                console.log(error);
            });
        }
    });
```

##### After (>= 1.0.0-preview.0)

```javascript
    myMSALObj = new UserAgentApplication(config);

    // Login
    loginPopup(loginRequest).then(function(response) {
        var idToken = response.idToken;
        // etc.
    }).catch(function(error) {
        // Catches any rejects thrown by loginPopup. Also catches errors thrown the above 'then' block
        if (error.ClientConfigurationError) {
            // Error with configuration, please check your parameters.
        } else if (error instanceof ClientAuthError) {
            // authentication could not be completed due to protocol error, browser error or already in progress
        } else if (error instanceof ServerError) {
            // server may be temporarily unavailable, or the request that was sent was invalid or not acceptable. Please check error returned and retry.
        } else {
            // Unexpected error, console.log and report on Github or StackOverflow
        }
    });

    // access token
    acquireTokenPopup(tokenRequest).then(function(response) {
        var idToken = response.idToken;
        var accessToken = response.accessToken;
        // etc.
    }).catch(function(error) {
        // Catches any rejects thrown by loginPopup. Also catches errors thrown the above 'then' block
        if (error.ClientConfigurationError) {
            // Error with configuration, please check your parameters.
        } else if (error instanceof ClientAuthError) {
            // authentication could not be completed due to protocol error, browser error or already in progress
        } else if (error instanceof ServerError) {
            // server may be temporarily unavailable, or the request that was sent was invalid or not acceptable. Please check error returned and retry.
        } else {
            // Unexpected error, console.log and report on Github or StackOverflow
        }
    });
```

We will follow up with a detailed blog post and a Quickstart Application soon with these changes.


# 0.2.4
## New Features
* Unified Cache - This is to support migration from ADAL.js to MSAL.js. If your app is currently using ADAL.js and if user already has an existing session there, when your app migrates to MSAL.js,
MSAL.js will do a Silent login.
* Removal of prompt-select account - Removes prompt parameter from interactive login and acquireToken requests. acquireTokenSilent will continue to pass prompt=none.
* End-to-end testing for msal-core
* Support for redirect URI as a function

# 0.2.3
## New Features
* Single Sign on
* IE and edge bug fix if navigateToLoginRequestUrl=false (cookies not deleted)
* IE and edge bug fix for login_popup (state mismatch)
* User state not passed to callback if navigateToLoginrequestUrl = false
* Added sample app for single sign on


# 0.2.2
## New Features
* Added support to handle the issue of the session storage and local storage getting cleared in IE and edge browsers during redirects across different security zones. This can be enabled by setting storeAuthStateInCookie flag in config to true. Default value is false.
https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/347


# 0.2.1
## New Features
* Added State parameter in login request. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/262

* Removed istanbul code coverage due to webpack bundle size issue.

# 0.2.0
## New Features
Moved npmjs package to @azure/msal

# 0.1.9
## New Features

* Fixed bug to use acquireTokenRedirect to call your own APIS. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/333
* Fixed bug to delete temporary cache entries in cases of errors. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/327


# 0.1.7
## New Features

* Fixed bug with resolveAuthority in acquireTokenSilent. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/322
* Fixed bug with window.opener for cases when app is opened due to a click event. https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/318

# 0.1.6
## New Features

* Fixed bug with concurrent acquireToken requests. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/274
* Added catchHandler for authority validation
* Fixed bug to handle the case for id_token with special characters.

# 0.1.5
## Breaking Changes

* The constructor function in Msal is no longer asynchronous. To use the instance of userAgentApplication in the callback function passed in the constructor, use "this" in the calback function scope. Please see below:
```
 var userAgentApplication = new Msal.UserAgentApplication(applicationConfig.clientID, null, authCallback);
        function authCallback(errorDesc, token, error, tokenType) {
                   console.log(userAgentApplication) //this will print undefined, use this instead
                   var self  = this// self is instance of userAgentApplication
           }
```

## New Features

* By default, msal tries to take you back to the loginStartPage after successful authentication. To disable this setting, you can pass navigateToLoginRequestUrl:false
in the options object in the constructor. In that case, msal will just set the url hash to null and call the provided callback, thereby avoiding an additional reload. Please see snippet below:
```
 var userAgentApplication = new Msal.UserAgentApplication(applicationConfig.clientID, null, authCallback, { navigateToLoginRequestUrl:false });
```
* The idToken object is now added as a property on user object in msal which can be used to query claims and the User class itself is exported under the global namespace.
* loadFrameTimout(msec) is now configurable by setting it to a value in the options object passed to the userAgentApplication contructor. The default timeout is 6000 msec. Please see the snippet below to change it:
```
 var userAgentApplication = new Msal.UserAgentApplication(applicationConfig.clientID, null, authCallback, { loadFrameTimout:10000 });
```

# 0.1.4-beta

## Bug Fixes

* Test version

# 0.1.3

## Bug Fixes

* Added ability to import msal as es-5 or es-6 module.
* Added webpack to create a umd bundle with a global variable Msal exported to the window  object.
* Fixed bug related to browser refresh.
* Set user object from cache if available before every acquireToken request.
* Enable logging by passing a logger in the constructor function.

# 0.1.2
## Bug Fixes
* Fixed bug with renewal of id_token.
* Added support for multiple asynchronous acquireToken requests.
* Added "user_cancelled" event for popup window.

# 0.1.1
## Bug Fixes
* Fix browser specific issues.

# 0.1.0
Preview Release
