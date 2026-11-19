# Control sign-in prompts

The `prompt` request parameter tells the identity provider which sign-in experience to attempt. It is not a switch for MSAL's cache, popup window, or redirect mechanism. The identity provider ultimately determines which interactions are required by the account, permissions, and tenant policies.

## Prompt values

| Value | Intended identity-provider behavior |
| --- | --- |
| `login` | Request reauthentication rather than using the existing sign-in session without interaction. It does not specify which authentication method a policy will require. |
| `select_account` | Show an account-selection experience, including an option to use another account. |
| `consent` | Request the consent experience. This cannot grant permissions that require an administrator or bypass tenant consent policy. |
| `none` | Do not display sign-in, account-selection, or consent UI. Return an error if the request cannot complete without interaction. |
| `create` | Request account creation where supported by the identity provider and account type. |

Support can vary between Microsoft Entra ID, personal Microsoft accounts, B2C policies, and other authorities. Interactive requests forward `prompt` to the authority without local value validation, so an unsupported value can produce an authority error. Silent iframe requests instead normalize interactive prompt values to `none`.

## Defaults and method differences

| API | Behavior |
| --- | --- |
| `loginPopup`, `loginRedirect`, `acquireTokenPopup`, `acquireTokenRedirect` | No `prompt` value is added by default. Existing sessions and provider policy determine whether UI appears. |
| `ssoSilent` | Uses `prompt=none` for normal SSO requests in a hidden iframe. An interactive prompt value is replaced with `none`. |
| `acquireTokenSilent` | Looks in the cache and renews tokens as needed. Its request accepts `prompt`, but any iframe fallback must remain noninteractive; interactive prompt values are replaced with `none`. |

Do not use the internal `no_session` value as an application sign-in option. `forceRefresh` on a silent request controls cache/refresh-token behavior, not credential prompting; see [token lifetimes](./token-lifetimes.md).

## Request account selection

After [initialization](./initialization.md), invoke an interactive method from a user action:

```javascript
const result = await msalInstance.loginPopup({
    scopes: ["User.Read"],
    prompt: "select_account",
});
msalInstance.setActiveAccount(result.account);
```

Use `prompt: "login"` only when the scenario needs reauthentication. Adding it to every request defeats session-based SSO. A login hint can identify an account but does not override a requirement to authenticate or consent.

## Use an existing session without an iframe

When third-party cookie restrictions prevent iframe SSO, a popup can sometimes access an existing identity-provider session without showing a credential prompt:

```javascript
const result = await msalInstance.loginPopup({
    scopes: ["User.Read"],
    loginHint: knownLoginHint,
    prompt: "none",
});
```

This still opens a popup and requires a user gesture to avoid popup blocking. It is not guaranteed to be visually silent or to succeed: if there is no suitable session, consent is needed, or policy requires interaction, surface the failure and let the user start a normal interactive request without `prompt: "none"`. Do not retry in a loop.

Configure the [redirect bridge](./redirect-bridge.md) for popup and silent responses. See [single sign-on](./single-sign-on.md) and [error handling](./handle-errors.md) for account hints and fallback behavior.
