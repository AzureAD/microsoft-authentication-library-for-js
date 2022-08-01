# Events

Msal-Browser (`@azure/msal-browser`) starting at version 2.4 now provides event APIs that are available to users of our core library and wrapper libraries. These events are related to auth and what MSAL is doing, and can be used in applications to update UI, show error messages, and so on.

## What events look like
```javascript
export type EventMessage = {
    eventType: EventType;
    interactionType: InteractionType | null;
    payload: EventPayload;
    error: EventError;
    timestamp: number;
};
```

The payload and error in `EventMessage` are defined as follows: 
```javascript
export type EventPayload = PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest | EndSessionRequest | AuthenticationResult | PopupEvent | null;

export type EventError = AuthError | Error | null;
```

## How events are emitted in msal-browser
Msal-browser has a protected function `emitEvent`, and emits events in major APIs. For the list of currently emitted events, see the table below.

Here is an example of how msal-browser emits an event with a payload, or with an error:

```javascript
this.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Redirect, result);

this.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);
```

## How to use the event API
Msal-browser exports the `addEventCallback` function which takes in a callback function and can be used to process emitted events. 

Here is an example of how you could consume the emitted events in your application:
```javascript
const callbackId = msalInstance.addEventCallback((message: EventMessage) => {
    // Update UI or interact with EventMessage here
    if (message.eventType === EventType.LOGIN_SUCCESS) {
        console.log(message.payload);
     }
});
```
Adding an event callback will return an id. This id can be used to remove the callback if necessary, using the `removeEventCallback` function exported by msal-browser:

```javascript
msalInstance.removeEventCallback(callbackId);
```

### Handling errors
Due to the way `EventError` is defined, handling errors emitted with an event may require validating that the error is of the correct type before accessing specific properties on the emitted error. The error can be cast to `AuthError` or checked that it is an instance of `AuthError`. 

Here is an example of consuming an emitted event and casting the error:

```javascript
const callbackId = msalInstance.addEventCallback((message: EventMessage) => {
    // Update UI or interact with EventMessage here
    if (message.eventType === EventType.LOGIN_FAILURE) {
        if (message.error instanceof AuthError) {
            // Do something with the error
        }
     }
});
```

## Syncing logged in state across tabs and windows

If you would like to update your UI when a user logs in or out of your app in a different tab or window you can subscribe to the `ACCOUNT_ADDED` and `ACCOUNT_REMOVED` events. The payload will be the `AccountInfo` object that was added or removed.

These events will not be emitted by default. In order to enable these events you must call the `enableAccountStorageEvents` API before registering your event callbacks:

```javascript
msalInstance.enableAccountStorageEvents();
msalInstance.addEventCallback((message: EventMessage) => {
    if (message.eventType === EventType.ACCOUNT_ADDED) {
        // Update UI with new account
    } else if (message.eventType === EventType.ACCOUNT_REMOVED) {
        // Update UI with account logged out
    }
});
```

You can also disable these events if no longer needed by calling `disableAccountStorageEvents`:

```javascript
msalInstance.disableAccountStorageEvents();
```

## Table of events
These are the events currently emitted by msal-browser.

| Event Type                    | Description                                                                | Interaction Type                 | Payload                                         | Error              |
|:-----------------------------:|:--------------------------------------------------------------------------:|:--------------------------------:|:-----------------------------------------------:|:------------------:|
| `LOGIN_START`                 | LoginPopup or loginRedirect is called                                      | `Popup` or `Redirect`            | [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) or [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest)                 |                    |
| `LOGIN_SUCCESS`               | Successfully logged in                                                     | `Popup` or `Redirect`            | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult)                            |                    |
| `LOGIN_FAILURE`               | Error when logging in                                                      | `Popup` or `Redirect`            |                                                 | [AuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) or Error |
| `ACQUIRE_TOKEN_START`         | AcquireTokenPopup or acquireTokenRedirect or acquireTokenSilent is called  | `Popup` or `Redirect` or `Silent`| [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) or [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest) or [SilentRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#silentrequest) |                    |
| `ACQUIRE_TOKEN_SUCCESS`       | Successfully acquired token from cache or network                          | `Popup` or `Redirect` or `Silent`| [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult)                            |                    |
| `ACQUIRE_TOKEN_FAILURE`       | Error when acquiring token                                                 | `Popup` or `Redirect` or `Silent`|                                                 | [AuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) or Error |
| `ACQUIRE_TOKEN_NETWORK_START` | Starting acquiring token from network                                      | `Silent`                         |                                                 |                    |
| `SSO_SILENT_START`            | SsoSilent API called                                                       | `Silent`                         | [SsoSilentRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#ssosilentrequest)                                |                    |
| `SSO_SILENT_SUCCESS`          | SsoSilent succeeded                                                        | `Silent`                         | [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult)                            |                    |
| `SSO_SILENT_FAILURE`          | SsoSilent failed                                                           | `Silent`                         |                                                 | [AuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) or Error |
| `HANDLE_REDIRECT_START`       | HandleRedirectPromise called                                               | `Redirect`                       |                                                 |                    |
| `HANDLE_REDIRECT_END`         | HandleRedirectPromise finished                                             | `Redirect`                       |                                                 |                    |
| `LOGOUT_START`                | Logout called                                                              | `Redirect` or `Popup`            | [EndSessionRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionrequest) or [EndSessionPopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest)                               |                    |
| `LOGOUT_END`                  | Logout finished                                                            | `Redirect` or `Popup`            |                           |                    |
| `LOGOUT_SUCCESS`              | Logout success                                                             | `Redirect` or `Popup`            | [EndSessionRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionrequest) or [EndSessionPopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest)                              |                    |
| `LOGOUT_FAILURE`              | Logout failed                                                              | `Redirect` or `Popup`            |                                                 | [AuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) or Error |
| `ACCOUNT_ADDED`               | Account logged-in in a different tab or window                             | N/A            | [AccountInfo](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#accountinfo)                                               | N/A |
| `ACCOUNT_REMOVED`             | Account logged-out in a different tab or window                            | N/A            | [AccountInfo](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#accountinfo)                                               | N/A |
| `INITIALIZE_START`            | Initialize function called                                                 | N/A            | N/A    | N/A |
| `INITIALIZE_END`              | Initialize function completed                                              | N/A            | N/A    | N/A |
