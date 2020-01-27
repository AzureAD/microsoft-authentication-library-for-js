# Instantiate the UserAgentApplication

`UserAgentApplication` can be configured with a variety of different options, detailed [below](#configuration-options), but the only required parameter is `auth.clientId`.

After instantiating your instance, if you plan on using a redirect flow (`loginRedirect` and `acquireTokenRedirect`), you must register a callback handlers  using `handleRedirectCallback(authCallback)` where `authCallback = function(AuthError, AuthResponse)`. The callback function is called after the authentication request is completed either successfully or with a failure. This is not required for the popup flows since they return promises.

```JavaScript
    import * as Msal from "msal";
    // if using cdn version, 'Msal' will be available in the global scope

    const msalConfig = {
        auth: {
            clientId: 'your_client_id'
        }
    };

    const msalInstance = new Msal.UserAgentApplication(msalConfig);

    msalInstance.handleRedirectCallback((error, response) => {
        // handle redirect response or error
    });

```

For details on the configuration options, read [Initializing client applications with MSAL.js](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications).

## Configuration Options

Below is the total set of configurable options that are supported currently in the config object.  

```javascript
    type storage = "localStorage" | "sessionStorage";

    // Protocol Support
    export type AuthOptions = {
        clientId: string;
        authority?: string;
        validateAuthority?: boolean;
        redirectUri?: string | (() => string);
        postLogoutRedirectUri?: string | (() => string);
        navigateToLoginRequestUrl?: boolean;
    };

    export type CacheOptions = {
        cacheLocation?: CacheLocation;
        storeAuthStateInCookie?: boolean;
    };

    // Library support
    // note: Telemetry is not yet instrumented, will be a part of future release
    export type SystemOptions = {
        logger?: Logger;
        loadFrameTimeout?: number;
        tokenRenewalOffsetSeconds?: number;
        navigateFrameWait?: number;
        telemetry?: TelemetryOptions
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

## Cache Storage

We offer two methods of storage for MSAL.js, `localStorage` and `sessionStorage`.  Our recommendation is to use `sessionStorage` because it is more secure in storing tokens that are acquired by your users, but `localStorage` will give you Single Sign On across tabs and user sessions.  We encourage you to explore the options and make the best decision for your application.
