# Single sign-on scenarios

Single sign-on (SSO) lets a user reuse an existing identity-provider session rather than enter credentials for every application. It does not mean applications share access tokens.

## Identity-provider session versus application cache

The identity provider maintains its sign-in session in cookies on its own domain. MSAL maintains accounts and tokens in the application's [cache](./caching.md) on the application's origin. These have independent lifetimes:

- A cached account does not prove that the identity-provider session still exists or that a token request will succeed.
- A user can have an identity-provider session but no accounts in a new application's MSAL cache.
- Applications with different client IDs or origins must acquire their own tokens. Do not copy tokens or MSAL cache entries between applications.

For an account already known to the application, use `acquireTokenSilent` first. Use `ssoSilent` to establish an application session from an existing identity-provider session when the necessary hints are available.

## Tabs of the same application

Choose a [cache location](./caching.md) deliberately. `localStorage` supports account and token sharing between tabs of the same origin; `sessionStorage` and memory storage do not provide the same cross-tab persistence. Storage partitioning and browser privacy features can further restrict sharing.

Select an account explicitly using [account APIs](./accounts.md). Array order from `getAllAccounts()` is not an account-selection policy. Use [account storage events](./events.md) to update the UI when another tab adds or removes an account. An application's active-account selection is not a global identity-provider session selector.

## Different applications

Each application must have the correct registration, authority, permissions, and redirect URI. An existing session can reduce prompts, but it does not transfer consent from one client to another.

Give the authority enough information to choose the intended session:

| Hint | Use |
| --- | --- |
| `account` | Pass an `AccountInfo` from this application's MSAL cache when available. |
| `loginHint` | Prefer `account.loginHint` or the `login_hint` ID-token claim when supplied. A username/UPN is not always a reliable sign-in hint. |
| `sid` | Identifies a specific identity-provider session when the ID token includes this optional claim. Prefer the login hint when available. |

Do not use a hint as proof of identity or authorization. If your applications exchange a hint, use a trusted application communication mechanism and still validate authentication normally. Avoid exposing identifiers in URLs.

The following assumes an initialized instance and a login hint obtained by the application through a trusted channel:

```javascript
import { InteractionRequiredAuthError } from "@azure/msal-browser";

async function trySso(loginHint) {
    try {
        const result = await msalInstance.ssoSilent({
            scopes: ["User.Read"],
            loginHint,
        });
        msalInstance.setActiveAccount(result.account);
        return result;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // The caller should display a sign-in action, not retry silently.
            return null;
        }
        throw error;
    }
}
```

Here, `null` explicitly means that user interaction is needed; it is not an authenticated result. The caller must handle this by offering sign-in. Network, configuration, and browser failures are rethrown rather than mistaken for a signed-out user.

## Browser restrictions and interactive fallback

Hidden iframe SSO depends on access to the identity-provider session. Third-party cookie blocking, sandboxing, and storage partitioning can prevent it even when a top-level sign-in session exists. See [iframe usage](./iframe-usage.md) and [browser-specific guidance](./browser-specific-guidance.md).

When silent authentication cannot complete, offer a popup or redirect sign-in. Start popups from a user action and avoid concurrent interactive requests. A popup with `prompt: "none"` can sometimes reuse a session without an iframe, but still opens a window and can fail; see [prompt behavior](./prompt-behavior.md).

Use the dedicated [redirect bridge](./redirect-bridge.md) required by the current library. Do not replace it with an empty HTML page or bootstrap the full application inside the silent iframe.

SSO does not bypass Conditional Access, MFA, consent, session expiration, or tenant restrictions. Follow [error handling](./handle-errors.md) rather than repeatedly retrying a request that needs interaction. For sign-out semantics, including local cache versus server session, see [logout](./logout.md).
