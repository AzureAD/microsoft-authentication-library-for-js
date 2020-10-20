# Events

MSAL.js 2.0 provides event APIs that are available to users of our core library and wrapper libraries. These events are related to auth and what MSAL is doing, and can be used in applications to update UI, show error messages, and so on.

## What Events look like
```javascript
export type EventMessage = {
    eventType: EventType;
    interactionType: InteractionType | null;
    payload: EventPayload;
    error: EventError;
    timestamp: number;
};
```

## How to use the Event API
Msal-browser exports the `addEventCallback` function which takes in a callback function and can be used to process emitted events. Events are emitted in msal-browser according to the list below.

Here is an example of how you could consume the emitted events in your application:
```javascript
msalInstance.addEventCallback((message: EventMessage) => {
    // Update UI or interact with EventMessage here
    if (message.eventType === EventType.LOGIN_SUCCESS) {
        console.log(message.payload);
     }
});
```

## List of Event Types

This the list of events currently emitted by msal-browser.

| Event Type  | Description  | Interaction Type  | Payload   | Error |
|------------ |:----------: |:-----------: |:------------: | :---------:|
| `LOGIN_START` | LoginPopup or loginRedirect are called | `Popup` or `Redirect` | PopupRequest or RedirectRequest | 
| `LOGIN_SUCCESS` | Successfully logged in |`Popup` or `Redirect`| AuthenticationResult | 
| `LOGIN_FAILURE` | Error when logging in | `Popup` or `Redirect`|  | AuthError or Error |
| `ACQUIRE_TOKEN_START`   | AcquireTokenPopup or acquireTokenRedirect or acquireTokenSilent are called |`Popup` or `Redirect` or `Silent`| PopupRequest or RedirectRequest or SilentRequest|  
| `ACQUIRE_TOKEN_SUCCESS` | Successfully acquired token from cache or network |`Popup` or `Redirect` or `Silent`| AuthenticationResult |
| `ACQUIRE_TOKEN_FAILURE` | Error when acquiring token |`Popup` or `Redirect` or `Silent`|  | AuthError or Error |
| `ACQUIRE_TOKEN_NETWORK_START` | Starting acquiring token from network |`Silent`|               |            
| `SSO_SILENT_START` | SsoSilent API called |`Silent`|SsoSilentRequest|
| `SSO_SILENT_SUCCESS` | SsoSilent succeeded |`Silent`| AuthenticationResult |
| `SSO_SILENT_FAILURE` | SsoSilent failed |`Silent`|  | AuthError or Error |
| `HANDLE_REDIRECT_START` | HandleRedirectPromise called and hash being processed | `Redirect` | | 
| `LOGOUT_START` | Logout called |`Redirect`| EndSessionRequest |
| `LOGOUT_SUCCESS` | Logout success |`Redirect`|EndSessionRequest|
| `LOGOUT_FAILURE`| Logout failed|`Redirect`|  | AuthError or Error |
