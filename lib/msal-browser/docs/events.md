# Events

Msal Browser (`@azure/msal-browser`) provides event APIs that are available to users of our core library and wrapper libraries. These events are related to auth and what MSAL is doing, and can be used in applications to update UI, show error messages, and so on.

> :warning: **Do not use events for telemetry.** Events are intended for reacting to auth state changes in your application (e.g. updating UI or showing error messages). They are not a telemetry mechanism: the set of events, their timing, and their payloads are not guaranteed to be stable across versions, and relying on them to collect metrics or measure performance is not supported. For telemetry and performance monitoring, see [Performance](./performance.md) and [Telemetry config options](./configuration.md#telemetry-config-options).

## What events look like

```typescript
export type EventMessage = {
    eventType: EventType;
    interactionType: InteractionType | null;
    payload: EventPayload;
    error: EventError;
    timestamp: number;
};
```

You can consult the [EventPayload](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.EventPayload.html) and [EventError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.EventError.html) type docs to understand how they are defined in MSAL.

## How events are emitted in MSAL Browser

Msal Browser has a protected function `emitEvent`, and emits events in major APIs. For the list of currently emitted events, see the table below.

Here is an example of how MSAL Browser emits an event with a payload, or with an error:

```javascript
this.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Redirect, result);

this.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
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

> [!NOTE]
> Please do not use events for critical flows in your application, or for telemetry, as they are not guaranteed to be emitted in all cases and are not meant for controlling the logic of your application. They are meant to be used as a way to interact with MSAL and update your UI accordingly, and should not be used as the only way to determine if an action was successful or not. Always use the response from the API calls to determine if an action was successful or not.

### Handling errors

Due to the way `EventError` is defined, handling errors emitted with an event may require validating that the error is of the correct type before accessing specific properties on the emitted error. The error can be cast to `AuthError` or checked that it is an instance of `AuthError`.

Here is an example of consuming an emitted event and casting the error:

```javascript
const callbackId = msalInstance.addEventCallback((message: EventMessage) => {
    // Update UI or interact with EventMessage here
    if (message.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
        if (message.error instanceof AuthError) {
            // Do something with the error
        }
    }
});
```

### Getting interaction status from events

You can get the current interaction status from events by using the [getInteractionStatusFromEvent](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.eventmessageutils.html#getinteractionstatusfromevent) API:

Here is an example of displaying a message when there are no interactions in progress:

```javascript
const callbackId = msalInstance.addEventCallback((message: EventMessage) => {
    const status = EventMessageUtils.getInteractionStatusFromEvent(message);

    // Update UI or interact with EventMessage here
    if (status === InteractionStatus.None) {
        console.log(message.payload);
    }
});
```

## Syncing logged in state across tabs and windows

If you would like to update your UI when a user logs in or out of your app or changes the active account in a different tab or window you can subscribe to the `LOGIN_SUCCESS`, `LOGOUT_SUCCESS`, and `ACTIVE_ACCOUNT_CHANGED` events.

-   For account additions and removals, the payload will be the `AccountInfo` object that was added or removed.
-   For active account updates, there will be no payload

```javascript
msalInstance.addEventCallback((message: EventMessage) => {
    if (message.eventType === EventType.LOGIN_SUCCESS) {
        // Update UI with new account
    } else if (message.eventType === EventType.LOGOUT_SUCCESS) {
        // Update UI with account logged out
    } else if (message.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
        const accountInfo = msalInstance.getActiveAccount();
        // Update UI with new active account info
    }
});
```

## Table of events

These are the events currently emitted by msal-browser.

|          Event Type           |                                Description                                |         Interaction Type          |                                                                                                                                                                                                          Payload                                                                                                                                                                                                          |                                                                 Error                                                                 |
| :---------------------------: | :-----------------------------------------------------------------------: | :-------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
|         `LOGIN_START`         |                   LoginPopup or loginRedirect is called                   |       `Popup` or `Redirect`       |                                                                     [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) or [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest)                                                                      |                                                                                                                                       |
|        `LOGIN_SUCCESS`        |                          Successfully logged in                           |       `Popup` or `Redirect`       |                                                                                                                                              [AccountInfo](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_common.AccountInfo.html)                                                                                                                                               |                                                                                                                                       |
|        `LOGIN_FAILURE`        |                           Error when logging in                           |       `Popup` or `Redirect`       |                                                                                                                                                                                                                                                                                                                                                                                                                           | [AuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) or Error |
|     `ACQUIRE_TOKEN_START`     | AcquireTokenPopup or acquireTokenRedirect or acquireTokenSilent is called | `Popup` or `Redirect` or `Silent` | [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) or [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest) or [SilentRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#silentrequest) |                                                                                                                                       |
|    `ACQUIRE_TOKEN_SUCCESS`    |             Successfully acquired token from cache or network             | `Popup` or `Redirect` or `Silent` |                                                                                                                                    [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult)                                                                                                                                     |                                                                                                                                       |
|    `ACQUIRE_TOKEN_FAILURE`    |                        Error when acquiring token                         | `Popup` or `Redirect` or `Silent` |                                                                                                                                                                                                                                                                                                                                                                                                                           | [AuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) or Error |
|    `HANDLE_REDIRECT_START`    |                       HandleRedirectPromise called                        |            `Redirect`             |                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                       |
|     `HANDLE_REDIRECT_END`     |                      HandleRedirectPromise finished                       |            `Redirect`             |                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                       |
|        `LOGOUT_START`         |                               Logout called                               |       `Redirect` or `Popup`       |                                                         [EndSessionRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionrequest) or [EndSessionPopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest)                                                          |                                                                                                                                       |
|         `LOGOUT_END`          |                              Logout finished                              |       `Redirect` or `Popup`       |                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                       |
|       `LOGOUT_SUCCESS`        |                              Logout success                               |       `Redirect` or `Popup`       |                                                         [EndSessionRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionrequest) or [EndSessionPopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest)                                                          |                                                                                                                                       |
|       `LOGOUT_FAILURE`        |                               Logout failed                               |       `Redirect` or `Popup`       |                                                                                                                                                                                                                                                                                                                                                                                                                           | [AuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) or Error |
|   `ACTIVE_ACCOUNT_CHANGED`    |     Active account filters where changed in a different tab or window     |                N/A                |                                                                                                                                                                                                            N/A                                                                                                                                                                                                            |                                                                  NA                                                                   |
|      `INITIALIZE_START`       |                        Initialize function called                         |                N/A                |                                                                                                                                                                                                            N/A                                                                                                                                                                                                            |                                                                  N/A                                                                  |
|       `INITIALIZE_END`        |                       Initialize function completed                       |                N/A                |                                                                                                                                                                                                            N/A                                                                                                                                                                                                            |                                                                  N/A                                                                  |
