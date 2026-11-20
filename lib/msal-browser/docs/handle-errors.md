# Handle authentication errors

Handle failures at the boundary of each authentication operation. Error descriptions are developer diagnostics, are not localized UI messages, and can change. Use error classes and `errorCode` to choose a recovery path; display your own localized, actionable message to the user.

## Error categories

| Category | Typical response |
| --- | --- |
| `AuthError` | Base authentication error type. Capture the error code and correlation ID for diagnosis. |
| `ClientConfigurationError` | Correct configuration or request arguments before retrying. |
| `ClientAuthError` / `BrowserAuthError` | Check initialization, account selection, browser restrictions, and interaction lifecycle. |
| `ServerError` | Inspect the service error code and suberror. Correct invalid requests; only retry failures that are transient. |
| `InteractionRequiredAuthError` | A silent request needs user interaction, such as sign-in, consent, or an MFA/Conditional Access requirement. |

`InteractionRequiredAuthError` is a specialized server error; check it before broader server-error handling. See the [error catalog](../../../docs/errors.md) for individual codes and [logging](./logging.md) for diagnostic setup.

## Silent requests and popup fallback

After [initialization](./initialization.md), try silent token acquisition for a selected account:

```javascript
import { InteractionRequiredAuthError } from "@azure/msal-browser";

async function getTokenSilently(account) {
    return msalInstance.acquireTokenSilent({
        scopes: ["User.Read"],
        account,
    });
}

try {
    const result = await getTokenSilently(selectedAccount);
    // Use result.accessToken only with the intended protected API.
} catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
        // Show a "Continue sign-in" action. Its click handler can call
        // acquireTokenPopup with the same scopes and selected account.
        showContinueSignIn();
    } else {
        throw error;
    }
}
```

`msalInstance`, `selectedAccount`, and `showContinueSignIn` represent the application's initialized instance, explicit account selection, and UI callback. The popup click handler must also handle errors, including user cancellation. Do not automatically turn every failure into a popup: network errors, invalid configuration, and canceled requests need different handling. Starting a popup after a long asynchronous operation can also trigger a popup blocker.

Wait for any existing interaction to finish before starting another. An `interaction_in_progress` error is not a signal to launch another login. Framework users should follow the [Angular](../../msal-angular/docs/errors.md) or [React](../../msal-react/docs/errors.md) interaction lifecycle.

## Redirect requests

Call and await `handleRedirectPromise()` during the main application's startup, and handle its rejection before starting new interactive work. The redirect initiation API and the processing of the returning response are separate error boundaries. See [initialization](./initialization.md) and the [redirect bridge](./redirect-bridge.md).

A redirect can navigate away before the initiating code receives a successful result. Process the result on return, not after `loginRedirect()` or `acquireTokenRedirect()`. Do not automatically restart login from the redirect error handler; this can create an infinite navigation loop.

## Conditional Access and claims challenges

An API can reject a token because extra claims are required. If a trusted protected API returns a claims challenge in `WWW-Authenticate`, extract and decode it according to the protocol, then pass the decoded JSON string as `claims` on the next token request. Preserve the scopes, account, and authority appropriate for that API.

Attempt silent acquisition with those claims first, and request interaction when MSAL raises `InteractionRequiredAuthError`. Replay the resource request only after obtaining the appropriate token. Do not blindly replay a non-idempotent operation, forward arbitrary challenge content to another authority, or loop on a challenge that cannot be satisfied.

See [claims challenges](../../msal-common/docs/claims-challenge.md) and [client capabilities](../../msal-common/docs/client-capability.md) for the protocol and configuration details. MFA is enforced by the identity provider; an application should not try to implement or bypass the challenge itself.

## Transient failures and throttling

Distinguish a transient network/service failure from a request that needs configuration changes or user interaction. MSAL already performs internal recovery in some paths and caches throttling information for token requests. Repeated calls may be rejected locally during a throttle window.

Do not add an unconditional retry around login or token acquisition. Respect `Retry-After` when supplied by the service, use bounded backoff with jitter for eligible transient operations, and stop after a limited number of attempts. Do not clear the cache to evade throttling. Retry behavior can differ by library version and flow; inspect diagnostics before adding a second application retry layer.

Token acquisition and resource calls have separate failure policies. A `401` or `403` from an API does not always mean the access token expired: verify audience, permissions, and any claims challenge before reacquiring a token.

## Capture useful diagnostics safely

Record the operation, library version, error code/suberror, timestamp, and correlation ID. Do not log access tokens, ID tokens, authorization codes, credentials, or raw authentication responses. Keep PII logging disabled unless a controlled troubleshooting process requires it; review logs before sharing them.

For SPAs, register an HTTPS redirect URI (or supported localhost development URI) using the **Single-page application** platform. Native-app custom URI schemes are not a workaround for SPA redirect validation or browser security restrictions.
