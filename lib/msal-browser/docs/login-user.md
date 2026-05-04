# Login User

Before you start here, make sure you understand how to [initialize the application object](./initialization.md).

The login APIs in MSAL retrieve an `authorization code` which can be exchanged for an [ID token](https://docs.microsoft.com/azure/active-directory/develop/id-tokens) for a signed in user, while consenting scopes for an additional resource, and an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) containing the user consented scopes to allow your app to securely call the API.

You can read more about ID tokens on our [Azure Docs pages](https://docs.microsoft.com/azure/active-directory/develop/id-tokens).

## Choosing an Interaction Type

See [here](./initialization.md#choosing-an-interaction-type) if you are uncertain about the differences between `loginRedirect` and `loginPopup`.

## Login the user

You must pass a request object to the login APIs. This object allows you to use different parameters in the request. See [here](./request-response-object.md) for more information on the request object parameters.

For login requests, all parameters are optional, so you can just send an empty object.

-   Popup

```javascript
try {
    const loginResponse = await msalInstance.loginPopup({});
} catch (err) {
    // handle error
}
```

-   Redirect

```javascript
try {
    msalInstance.loginRedirect({});
} catch (err) {
    // handle error
}
```

Or you can send a set of [scopes](./request-response-object.md#scopes) to pre-consent to:

-   Popup

```javascript
var loginRequest = {
    scopes: ["user.read", "mail.send"], // optional Array<string>
};

try {
    const loginResponse = await msalInstance.loginPopup(loginRequest);
} catch (err) {
    // handle error
}
```

-   Redirect

```javascript
var loginRequest = {
    scopes: ["user.read", "mail.send"], // optional Array<string>
};

try {
    msalInstance.loginRedirect(loginRequest);
} catch (err) {
    // handle error
}
```

## Account APIs

When a login call has succeeded, you can use the `getAllAccounts()` function to retrieve information about currently signed in users.

```javascript
const myAccounts: AccountInfo[] = msalInstance.getAllAccounts();
```

If you know the account information, you can also retrieve the account information by using the `getAccount()` API:

```javascript
const username = "test@contoso.com";
const myAccount: AccountInfo = msalInstance.getAccount({ username });

const homeAccountId = "userid.hometenantid"; // Best to retrieve the homeAccountId from an account object previously obtained through msal
const myAccount: AccountInfo = msalInstance.getAccount({ homeAccountId });
```

**Note:** Filtering by `username` is provided for convenience and should be considered less reliable than searching based on `homeAccountId`. When possible use `homeAccountId`.

In B2C scenarios your B2C tenant will need to be configured to return the `emails` claim on `idTokens` in order to use the `username` filter on the `getAccount()` API.

These APIs will return an account object or an array of account objects with the following signature:

```javascript
{
    // home account identifier for this account object
    homeAccountId: string;
    // Entity who issued the token represented as a full host of it (e.g. login.microsoftonline.com)
    environment: string;
    // Full tenant or organizational id that this account belongs to
    tenantId: string;
    // preferred_username claim of the id_token that represents this account.
    username: string;
}
```

## Silent login with ssoSilent()

If you already have a session that exists with the authentication server, you can use the ssoSilent() API to make requests for tokens without interaction.

### With User Hint

If you already have the user's sign-in information, you can pass this into the API to improve performance and ensure that the authorization server will look for the correct account session. You can pass one of the following into the request object in order to successfully obtain a token silently.

It is recommended to leverage the [`login_hint` optional ID token claim](https://docs.microsoft.com/azure/active-directory/develop/active-directory-optional-claims#v10-and-v20-optional-claims-set) (provided to `ssoSilent` as `loginHint`), as it is the most reliable account hint of silent (and interactive) requests.

-   `account` (which can be retrieved using on of the [account APIs](./accounts.md))
-   `sid` (which can be retrieved from the `idTokenClaims` of an `account` object)
-   `login_hint` (can be retrieved the following ways)
    - As the account object's `loginHint` property (recommended)
    - As the account object's `login_hint` ID token claim (recommended)
    - As the account object's `username` property  (not recommended)
    - As the account object's `upn` ID token claim (not recommended)

> [!NOTE]
> The `username` and `upn` properties are partially supported in place of the actual `login_hint` claim, but they are not recommended. Please use the `loginHint` or `idTokenClaims.login_hint` account properties if they are available.

Passing an account will look for the `login_hint` optional ID token claim (preferred), then the `sid` optional id token claim, then fall back to `loginHint` (if provided) or account username.

```javascript
const account = msalInstance.getAllAccounts()[0];

const silentRequest = {
    scopes: ["User.Read", "Mail.Read"],
    loginHint: account.loginHint, // alternatively, account.idTokenClaims.login_hint
};

try {
    const loginResponse = await msalInstance.ssoSilent(silentRequest);
} catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
        const loginResponse = await msalInstance
            .loginPopup(silentRequest)
            .catch((error) => {
                // handle error
            });
    } else {
        // handle error
    }
}
```

### Without User Hint

If there is not enough information available about the user, you can attempt to use the `ssoSilent` API **without** passing an `account`, `sid` or `login_hint`.

```javascript
const silentRequest = {
    scopes: ["User.Read", "Mail.Read"],
};
```

However, be aware that if your application has code paths for multiple users in a single browser session, or if the user has multiple accounts for that single browser session, then there is a higher likelihood of silent sign-in errors. You may see the following error show up in the event of multiple account sessions found by the authorization server:

```txt
InteractionRequiredAuthError: interaction_required: AADSTS16000: Either multiple user identities are available for the current request or selected account is not supported for the scenario.
```

This indicates that the server could not determine which account to sign into, and will require either one of the parameters above (`account`, `login_hint`, `sid`) or an interactive sign-in to choose the account.

> [!WARNING]
> When using `ssoSilent`, the service will attempt to load your redirect URI page in an invisible embedded iframe. Content security policies and HTTP header values present in your app's redirect URI page response, such as `X-FRAME-OPTIONS: DENY` and `X-FRAME-OPTIONS: SAMEORIGIN`, can prevent your app from loading in said iframe, effectively blocking silent SSO. If you intend you use `ssoSilent`, please make sure the redirect URI points to a page that does not implement any such policies.

## RedirectUri Considerations

**All authentication flows now require a dedicated redirect page** that implements the MSAL redirect bridge. This is necessary to support COOP (Cross-Origin-Opener-Policy) headers and enable secure communication between popup/iframe windows and the main application.

### Setting up the redirect page

Your `redirectUri` must point to a dedicated page that loads the redirect bridge script. This page should:

1. **Load the redirect bridge script** - This script handles communication with the main window
2. **Not include any JavaScript except for bridge script** - The redirect page should only run the bridge script
3. **Not include routing logic** - Avoid router libraries that might interfere with hash handling
4. **Be registered in your App Registration** - The URI must match exactly what's registered in Azure portal

**Example redirect page (when using a bundler such as Vite or Webpack):**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Redirect</title>
</head>
<body>
    <p>Processing authentication...</p>
    <script type="module">
        import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

        broadcastResponseToMainFrame();
    </script>
</body>
</html>
```

> [!NOTE]
> The `@azure/msal-browser/redirect-bridge` specifier must be resolved by a bundler (Vite, Webpack, etc.) — it is not a URL that browsers can fetch directly. For framework-specific instructions, see the [Redirect Bridge setup guide](./redirect-bridge.md).

### Configuration

You can set the `redirectUri` globally in your MSAL configuration or on a per-request basis:

**Global configuration:**

```javascript
const msalConfig = {
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "http://localhost:3000/redirect"
    }
};

const msalInstance = new PublicClientApplication(msalConfig);
```

**Per-request configuration:**

```javascript
msalInstance.loginPopup({
    scopes: ["user.read"],
    redirectUri: "http://localhost:3000/redirect"
});
```

For more information and complete sample implementations, see:
- [React Router Sample](../../../samples/msal-react-samples/react-router-sample)
- [Express Sample](../../../samples/msal-browser-samples/ExpressSample)

## Popup closure detection and `InteractionStatus`

Starting in MSAL Browser v5, popup authentication uses a [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) to receive the authentication response from the popup window. This replaces the previous `window.closed` polling mechanism used in earlier versions.

### What happens when a user manually closes the popup

When a user closes the popup window without completing authentication (e.g., clicks the X button), MSAL cannot detect the closure immediately. Because the popup communicates via BroadcastChannel rather than `window.opener`, MSAL has no way to observe when the popup window is closed. Instead, MSAL waits for the configured `popupBridgeTimeout` (default: 60 seconds) to expire before throwing a `timed_out` error.

This means:
- `InteractionStatus` remains `Login` (or `AcquireToken`) until the timeout fires
- The `LOGIN_FAILURE` (or `ACQUIRE_TOKEN_FAILURE`) event is emitted only after the timeout
- The `loginPopup()` (or `acquireTokenPopup()`) promise rejects with a `timed_out` error after the timeout

### Allowing the user to retry immediately

If a user closes the popup and you want to allow them to retry login without waiting for the timeout, use the `overrideInteractionInProgress` flag as described in the section below.

## Handling popup `interaction_in_progress` errors

For popup flows, you can use the `overrideInteractionInProgress` flag to cancel a pending interaction and start a new one. This is useful for recovery scenarios where the user cancelled a popup or an interaction failed.

> [!NOTE]
> This feature is **only available for popup flows** and is **not supported for redirect flows**. With the COOP (Cross-Origin-Opener-Policy) header, the traditional `window.opener` connection is severed, allowing popup windows to communicate with the main frame only via BroadcastChannel.

> [!CAUTION]
> Setting this to `true` will forcefully cancel any pending popup authentication request but **will not** close any open popups.

**When set to `true`:**
- If another popup interaction is currently in progress, it will be forcefully cancelled but any open popups will not be closed
- The pending interaction will reject with an `interaction_in_progress_cancelled` error
- The new popup flow will proceed immediately

**Valid use cases:**
- Recovering from errors where the user cancelled a popup (popup was closed without completing auth)
- Implementing custom error recovery flows
- Providing a "retry" mechanism after a failed popup interaction

**Default:** `false`

### Important: Only Use on Button Click

**Do NOT automatically retry** when catching an `interaction_in_progress` error. The override should **only** be triggered by an explicit user action (such as clicking a "Retry" button). Automatically overriding interactions can lead to:
- Race conditions between multiple authentication flows
- Unexpected cancellations of legitimate authentication attempts
- Poor user experience with authentication flows starting and stopping unexpectedly
- Many open popups that will not resolve to successful authentication responses

### Example: Proper error handling with user-triggered retry

For complete implementations with visual feedback, see:
- [ExpressSample](../../../samples/msal-browser-samples/ExpressSample) - Demonstrates JavaScript implementation with custom CSS
- [React Router Sample](../../../samples/msal-react-samples/react-router-sample) - Demonstrates React implementation with Material-UI components

Both samples demonstrate:
- Warning message displayed during popup authentication
- Retry modal/dialog with clear explanation when `interaction_in_progress` error occurs
- Proper state management for user-triggered retry
- Production-ready UI components

```typescript
// State to track if user wants to retry
let userWantsRetry = false;

// Button click handler
async function handleLoginClick() {
    try {
        const loginRequest = {
            scopes: ["user.read"]
        };

        // If user explicitly clicked retry, override the existing interaction
        if (userWantsRetry) {
            loginRequest.overrideInteractionInProgress = true;
            userWantsRetry = false; // Reset flag
        }

        const response = await msalInstance.loginPopup(loginRequest);
        // Handle successful login
    } catch (error) {
        if (error.errorCode === 'interaction_in_progress') {
            // Show retry button to user - DO NOT automatically retry
            showRetryButton();
        } else {
            // Handle other errors
            console.error(error);
        }
    }
}

// Retry button click handler
function handleRetryClick() {
    userWantsRetry = true; // Set flag for next login attempt
    handleLoginClick(); // User explicitly requested retry
}
```

### Example: React component with user-triggered retry


```jsx
function LoginButton() {
    const { instance } = useMsal();
    const [showRetry, setShowRetry] = useState(false);
    const [retryRequested, setRetryRequested] = useState(false);

    const handleLogin = async () => {
        try {
            const loginRequest = {
                scopes: ["user.read"],
                // Only override if user clicked the retry button
                overrideInteractionInProgress: retryRequested
            };

            setRetryRequested(false); // Reset retry flag

            const response = await instance.loginPopup(loginRequest);
            setShowRetry(false);
        } catch (error) {
            if (error.errorCode === 'interaction_in_progress') {
                // Show retry button - let user decide whether to retry
                setShowRetry(true);
            } else {
                console.error(error);
            }
        }
    };

    const handleRetry = () => {
        setRetryRequested(true); // User explicitly requested retry
        handleLogin();
    };

    return (
        <div>
            <button onClick={handleLogin}>Login</button>
            {showRetry && (
                <button onClick={handleRetry}>
                    Retry Login (Cancel Pending)
                </button>
            )}
        </div>
    );
}
```

# Next Steps

Learn how to [acquire and use an access token](./acquire-token.md)!
