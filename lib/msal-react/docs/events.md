# Events in MSAL React

For the most part `@azure/msal-react` abstracts away login calls and the handling of the response. As an application developer you are mostly left to determine which components should be protected and which method you'd like to use to sign your users in, but may be less concerned with the specifics of the response. There may be cases, however, where your application needs direct access to the response of a login call or maybe you need to handle a specific error. `@azure/msal-browser` exposes an [Event API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md) you can use for this purpose and this doc will walk you through how you can take advantage of this in a react app.

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
