# Using the MSAL.js Pairwise Broker

This document explains how to implement the pairwise broker flow for MSAL.js. This feature is meant for Microsoft 1st party applications, and will not be available for any third-party applications.

## Pre-requisites

### Acting as a broker

If you are an application that would like to broker tokens for embedded applications, you must obtain permission from the AAD eSTS Core Protocols team currently manually approves all brokers. Please contact the team here: `authn-team@microsoft.com` to find out more about how your app can enable this flow.

### Acting as a brokered application

If you are an application that would like to be brokered by another application, you must register a broker redirect URI in your application registration. You will need to know the client id of the application that will be the broker. You will also need to know the hostname of the page that your application will be running on. Once you have these pieces of info, you can register a SPA type redirect URI in your application registration with the following syntax:

`brk-<client id>://<embedded application hostname>`

This will inform eSTS that the client ID you provided is designated as a broker for the hostname you have provided.

## Configuration and Code Changes

The Pairwise Broker feature is available through the new MSAL Experimental API, which can be initialized through a different constructor than the usual `PublicClientApplication` constructor that is used for our current library. You can initialize this constructor as shown below:

```javascript
const experimentalApp = new msal.ExperimentalPublicClientApplication(msalConfig, expMsalConfig);
```

The two parameters being passed to the constructor is the [MSAL configuration object](./configuration.md), as well as the new experimental configuration which contains configuration options for experimental features. The experimental object contains the following broker configuration options:

```javascript
export type ExperimentalConfiguration = {
    brokerOptions?: BrokerOptions;
};

/**
 * Broker Options
 */
export type BrokerOptions = {
    actAsBroker?: boolean;
    preferredInteractionType: InteractionType.Popup | InteractionType.Redirect | InteractionType.None | null;
    allowBrokering?: boolean;
    trustedBrokerDomains?: string[];
    brokerRedirectParams?: Pick<RedirectRequest, "redirectStartPage" | "onRedirectNavigate">;
};
```

See [below](#broker-configuration-details) for more information on the broker options.

### Broker Configuration

For applications acting as brokers, they must create the experimental client with the above configuration options, and call the `initializeBrokering` function to prepare for the handshake as well. Below is an example of a properly configured broker.

```javascript
const msalConfig = {
    auth: {
        clientId: "654736c7-9f4e-4158-9c22-54081d1896c6"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case msal.LogLevel.Error:
                        console.error(message);
                        return;
                    case msal.LogLevel.Info:
                        console.info(message);
                        return;
                    case msal.LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case msal.LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

const expMsalConfig = {
    brokerOptions: {
        actAsBroker: true,
        preferredInteractionType: "redirect"
    }
};

const experimentalApp = new msal.ExperimentalPublicClientApplication(msalConfig, expMsalConfig);
experimentalApp.initializeBrokering().then(() => {
    // Must ensure that initialize has completed before calling any other MSAL functions
    experimentalApp.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });

    enableSigninButton();
});
```

### Brokered Application Configuration

For applications that want to be brokered by a parent, they can use the same configuration object, but set the options to be a brokered application, rather than a broker. They must also call the `initializeBrokering` function to begin the handshake process. Below is an example of a properly configured embedded application.

```javascript
// msalConfig is the same as above

const expMsalConfig = {
    brokerOptions: {
        allowBrokering: true,
        trustedBrokerDomains: ["http://localhost:30663"]
    }
};

const experimentalApp = new msal.ExperimentalPublicClientApplication(msalConfig, expMsalConfig);
experimentalApp.initializeBrokering().then(() => {
    // Must ensure that initialize has completed before calling any other MSAL functions
    experimentalApp.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });   
});
```

When an experimental application object configured as an embedded/brokered application uses the `loginPopup/acquireTokenPopup/ssoSilent` APIs, and the handshake was successful, it will instead send this request through the browser's `postMessage` API to the app designated as the broker. If the handshake was not successful, the API will act as it does in the `PublicClientApplication` class. You can catch any errors in the handshake from the `initializeBrokering` API call. 

NOTE: Be aware that any `loginRedirect/acquireTokenRedirect` API invocations will fail if called inside of an iframe, regardless of broker configuration.

The broker will consume the information from the `postMessage` API and create a brokered request in the top frame, then either perform a redirect or popup call (based on the configured behavior, if no behavior is configured it will follow whatever was called by the embedded/brokered application). There are a few nuances to how the interaction is handled:

- When the broker uses a popup, it will return it in the same Promise that was invoked inside of the embedded/brokered application.
- When the broker uses a redirect, the response will be returned by `handleRedirectPromise` once the handshake has been completed and the broker processes the authorization code hash.

## Broker Configuration Details

| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `actAsBroker` | boolean to designate whether to act as a broker. Should be set to `true` for brokers. | boolean | `false` |
| `preferredInteractionType` | Type of interaction to default to as the broker library. Can be set to `"popup"`, `"redirect"`, `"none"`, or `null`. | `InteractionType` enum | `null` |
| `allowBrokering` | boolean to designate whether to allow a parent frame to broker for the current application. Should be set to `true` for apps which want to be brokered by another application. | boolean | `false` |
| `trustedBrokerDomains` | string array of domains that this application trusts to broker for them. Will only allow domains that are specified here to successfully complete the handshake process. | `[]` |
| `brokerRedirectParams` | parameters to control the redirect flow. Should only be set in the context of the broker. | Object containing `redirectStartPage` and `onRedirectNavigate` parameters. See [here](../configuration.md) for more information. |
