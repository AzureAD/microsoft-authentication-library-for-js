# Events in MSAL React

For the most part `@azure/msal-react` abstracts away login calls and the handling of the response. As an application developer you are mostly left to determine which components should be protected and which method you'd like to use to sign your users in, but may be less concerned with the specifics of the response. There may be cases, however, where your application needs direct access to the response of a login call or maybe you need to handle a specific error. `@azure/msal-browser` exposes an [Event API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md) you can use for this purpose and this doc will walk you through how you can take advantage of this in a react app.

> :warning: **Do not use events for telemetry.** Events are intended for reacting to auth state changes in your application (e.g. updating UI or showing error messages). They are not a telemetry mechanism: the set of events, their timing, and their payloads are not guaranteed to be stable across versions, and relying on them to collect metrics or measure performance is not supported. For telemetry and performance monitoring, see MSAL Browser's [Performance](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/performance.md) and [telemetry configuration options](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md#telemetry-config-options).

## Registering and unregistering an event callback

Using the event API, you can register an event callback that will do something when an event is emitted.
When registering an event callback in a react component you will need to make sure you do 2 things.

1. The callback is registered only once
1. The callback is unregistered before the component unmounts.

### Function Component

In a function component you can use a `useEffect` hook with an empty dependency array to achieve this.

```javascript
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";

function EventExample() {
    const { instance } = useMsal();

    useEffect(() => {
        // This will be run on component mount
        const callbackId = instance.addEventCallback((message) => {
            // This will be run every time an event is emitted after registering this callback
            if (message.eventType === EventType.LOGIN_SUCCESS) {
                const result = message.payload;    
                // Do something with the result
            }
        });

        return () => {
            // This will be run on component unmount
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        }
        
    }, []);
}
```

### Class Component

In a class component you can use `componentDidMount` and `componentWillUnmount` to achieve this.

```javascript
class EventExample extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            callbackId: null;
        }
    }

    componentDidMount() {
        // This will be run on component mount
        const callbackId = this.props.msalContext.instance.addEventCallback((message) => {
            // This will be run every time an event is emitted after registering this callback
            if (message.eventType === EventType.LOGIN_SUCCESS) {
                const result = message.payload;    
                // Do something with the result
            }
        });

        this.setState({callbackId: callbackId});
    }

    componentWillUnmount() {
        // This will be run on component unmount
        if (this.state.callbackId) {
            this.props.msalContext.instance.removeEventCallback(this.state.callbackId);
        }
    }
}
```

## Syncing logged in state across tabs and windows

If you would like to update your UI when a user logs in or out of your app or changes the active account in a different tab or window you can subscribe to the `LOGIN_SUCCESS`, `LOGOUT_SUCCESS`, and `ACTIVE_ACCOUNT_CHANGED` events.

> Note: Cross-tab and cross-window event syncing in `@azure/msal-browser` is only available when `cache.cacheLocation` is set to `localStorage`. If you are using `sessionStorage` or in-memory storage, these events will not be received from other tabs or windows.

- For `LOGIN_SUCCESS`, the payload will be the logged in `AccountInfo` object (`result.account`).
- For `LOGOUT_SUCCESS`, the payload will be the logout request (`EndSessionRequest | EndSessionPopupRequest`).
- For `ACTIVE_ACCOUNT_CHANGED`, the payload will be `null`.

> [!IMPORTANT]
> For redirect logout flows, `LOGOUT_SUCCESS` is only broadcast to other tabs/windows when the logout request includes an `account`. If you call `logoutRedirect()` without an `account` (for example, to clear all accounts), other tabs/windows may not receive `LOGOUT_SUCCESS`. If you need reliable cross-tab logout syncing, prefer `logoutRedirect({ account })`.

```javascript
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";

function EventExample() {
    const { instance } = useMsal();

    useEffect(() => {
        // This will be run on component mount
        const callbackId = instance.addEventCallback((message) => {
            if (message.eventType === EventType.LOGIN_SUCCESS) {
                // Update UI with new account
            } else if (message.eventType === EventType.LOGOUT_SUCCESS) {
                // Update UI with account from the logout request
            } else if (message.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
                const accountInfo = instance.getActiveAccount();
                // Update UI with new active account info
            }
        });

        return () => {
            // This will be run on component unmount
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        }
        
    }, []);
}
```

## Reacting to active account changes

The `ACTIVE_ACCOUNT_CHANGED` event is emitted whenever `setActiveAccount()` is called. This includes calls made in the current tab (e.g., after a successful login) as well as changes made in other tabs or windows.

A common scenario where this event is useful is when a component needs to call a protected API using `getActiveAccount()`. After authentication completes, the render triggered by `ACQUIRE_TOKEN_SUCCESS` can run before `setActiveAccount()` has been called, causing `getActiveAccount()` to return `null`. By subscribing to `ACTIVE_ACCOUNT_CHANGED`, your component can retry the API call once the active account is available.

### Function Component

```javascript
import { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";

function ProfileContent() {
    const { instance } = useMsal();
    const [graphData, setGraphData] = useState(null);

    const fetchProfile = useCallback(() => {
        if (!instance.getActiveAccount()) {
            return;
        }
        callMsGraph()
            .then((response) => setGraphData(response))
            .catch((e) => {
                // Handle errors
            });
    }, [instance]);

    useEffect(() => {
        // Attempt to fetch immediately
        fetchProfile();

        // Retry when the active account is set
        const callbackId = instance.addEventCallback((event) => {
            if (event.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
                fetchProfile();
            }
        });

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, fetchProfile]);

    return graphData ? <ProfileData graphData={graphData} /> : null;
}
```

### Class Component

```javascript
import React from "react";
import { MsalContext } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";

class ProfileContent extends React.Component {
    static contextType = MsalContext;

    constructor(props) {
        super(props);
        this.state = { graphData: null };
        this.callbackId = null;
    }

    fetchGraphData() {
        if (this.state.graphData) return;
        if (!this.context.instance.getActiveAccount()) return;

        callMsGraph()
            .then((response) => this.setState({ graphData: response }))
            .catch((e) => {
                // Handle errors
            });
    }

    componentDidMount() {
        this.fetchGraphData();

        this.callbackId = this.context.instance.addEventCallback((event) => {
            if (event.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
                this.fetchGraphData();
            }
        });
    }

    componentWillUnmount() {
        if (this.callbackId) {
            this.context.instance.removeEventCallback(this.callbackId);
        }
    }

    render() {
        return this.state.graphData ? (
            <ProfileData graphData={this.state.graphData} />
        ) : null;
    }
}
```

For working examples, see the [Profile](../../../samples/msal-react-samples/react-router-sample/src/pages/Profile.jsx), [ProfileRawContext](../../../samples/msal-react-samples/react-router-sample/src/pages/ProfileRawContext.jsx), and [WelcomeName](../../../samples/msal-react-samples/react-router-sample/src/ui-components/WelcomeName.jsx) components in the react-router-sample.
