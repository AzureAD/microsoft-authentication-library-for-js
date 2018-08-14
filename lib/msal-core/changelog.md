# 0.2.1
### New Features
* Added State parameter in login request. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/262

* Removed istanbul code coverage due to webpack bundle size issue.

# 0.2.0
### New Features
Moved npmjs package to @azure/msal

# 0.1.9
### New Features

* Fixed bug to use acquireTokenRedirect to call your own APIS. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/333
* Fixed bug to delete temporary cache entries in cases of errors. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/327


# 0.1.7
### New Features

* Fixed bug with resolveAuthority in acquireTokenSilent. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/322
* Fixed bug with window.opener for cases when app is opened due to a click event. https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/318

# 0.1.6
### New Features

* Fixed bug with concurrent acquireToken requests. https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/274
* Added catchHandler for authority validation
* Fixed bug to handle the case for id_token with special characters.

# 0.1.5

### Breaking Changes

* The constructor function in Msal is no longer asynchronous. To use the instance of userAgentApplication in the callback function passed in the constructor, use "this" in the calback function scope. Please see below:
```
 var userAgentApplication = new Msal.UserAgentApplication(applicationConfig.clientID, null, authCallback);
        function authCallback(errorDesc, token, error, tokenType) {
                   console.log(userAgentApplication) //this will print undefined, use this instead
                   var self  = this// self is instance of userAgentApplication
           }
```		   

### New Features

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

### Bug fixes

* Test version

# 0.1.3

### Bug fixes

* Added ability to import msal as es-5 or es-6 module.
* Added webpack to create a umd bundle with a global variable Msal exported to the window  object.
* Fixed bug related to browser refresh. 
* Set user object from cache if available before every acquireToken request.
* Enable logging by passing a logger in the constructor function.

# 0.1.2
### Bug fixes
* Fixed bug with renewal of id_token.
* Added support for multiple asynchronous acquireToken requests.
* Added "user_cancelled" event for popup window.

# 0.1.1
### Bug fixes
* Fix browser specific issues.

# 0.1.0
Preview Release 
