# Preserve application state during authentication

Use the `state` request parameter to correlate a popup or redirect response with application context. For example, an application can remember which local view the user was on before sign-in.

MSAL generates and validates its own protocol state to protect the authentication transaction against cross-site request forgery. Your custom value is appended to that state; it does not replace MSAL's protection. After MSAL processes the response, `AuthenticationResult.state` contains your custom value, not MSAL's internal state.

## Send an opaque identifier

State travels through the authorization request and response. Do not put tokens, personal information, secrets, or a destination URL directly in it. Store the context locally and send a random identifier instead. Treat any recovered context as untrusted input before using it.

The following example assumes an [initialized MSAL instance](./initialization.md) and a [configured redirect bridge](./redirect-bridge.md). Call `signIn` from a user action. Keep response handling in the main application, not in the dedicated bridge page.

```javascript
const statePrefix = "app.auth-context.";

async function signIn() {
    const state = crypto.randomUUID();
    sessionStorage.setItem(
        `${statePrefix}${state}`,
        JSON.stringify({ view: "orders" })
    );

    try {
        await msalInstance.loginRedirect({
            scopes: ["User.Read"],
            state,
        });
    } catch (error) {
        sessionStorage.removeItem(`${statePrefix}${state}`);
        throw error;
    }
}

const response = await msalInstance.handleRedirectPromise();
if (response?.state) {
    const key = `${statePrefix}${response.state}`;
    const storedContext = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);

    if (storedContext !== null) {
        const context = JSON.parse(storedContext);
        if (context.view === "orders") {
            // Select the application's known orders view here.
        }
    }
}
```

For popup flows, pass `state` to `loginPopup` or `acquireTokenPopup` and read it from the resolved result. Process the result in the initiating window; do not assume storage in the popup is shared with the opener.

## Storage and navigation considerations

- Keep context on the application's own origin. `sessionStorage` is scoped to the origin and tab; it will not transfer context to another origin or an unrelated tab.
- Consume stored context once and expire abandoned entries. A canceled sign-in or closed tab might never return a successful result.
- If context includes a return destination, validate it against an allowlist of local routes. An authentication response must not become an open redirect.
- Do not manually construct, decode, or overwrite MSAL's internal state or use it as an application storage format.

See [request and response objects](./request-response-object.md) for the applicable request types.
