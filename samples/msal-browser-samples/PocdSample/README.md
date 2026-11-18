# Popup Origin Check (POCD) Sample

Demonstrates how MSAL.js computes the `pocd` ("popup origin check done") parameter
and how it affects Entra's `Cross-Origin-Opener-Policy` (COOP) response. The same
app signs in with a direct popup and the default redirect bridge in both trusted
and untrusted opener scenarios. There is no popup relay, legacy polling, EAR
configuration, or client-registration switch.

See [the POCD configuration guidance](../../../lib/msal-browser/docs/configuration.md#the-pocd-parameter)
for the full origin-check contract.

## What the sample demonstrates

| How the app is opened                                | MSAL authorize/logout parameter  | Entra sign-in document                                                               | Authentication result                                        |
| ---------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Directly, with no opener                             | `pocd=1`                         | Enforcing COOP is suppressed; the auth popup retains its opener                      | Sign-in and logout succeed                                   |
| From the cross-origin launcher, retaining its opener | Parameter omitted (computed `0`) | Enforcing `Cross-Origin-Opener-Policy: same-origin`; the auth popup loses its opener | Sign-in and logout still succeed through the redirect bridge |

Keep `auth.originCheck` enabled (the default). MSAL checks that all ancestors are
same-origin and that the top-level window has no opener or a same-origin opener.
Do not manually set `pocd=1` to force suppression or disable the origin check as a
general workaround.

The E2E suite additionally sends explicit `pocd=0` from the untrusted-opener case
to verify that the server treats it like omission. MSAL normally represents a
negative check by omitting the parameter, not by sending `0`.

## Configuration

[app/authConfig.js](app/authConfig.js) uses one fixed MSAL test registration,
`0845a021-afdf-4126-abdd-099c5e6948e1`, also used by the Vanilla JS E2E sample.
It is not centrally excluded from COOP. An excluded app or an app with
`coopEnforcement=false` cannot prove POCD suppression: its responses omit
enforcing COOP even when POCD is absent.

The bundled registration is for repository E2E validation. For your own
application, register a SPA and:

1. Replace `clientId` and `authority` in `app/authConfig.js`.
1. Register `https://localhost:3001/redirect` as a **Single-page application**
   redirect URI and allow it as the post-logout redirect URI.
1. Keep the app out of COOP exclusion lists and leave app-wide COOP overrides
   unset when validating the default POCD policy.

The sample sends authorize and logout requests to production Entra endpoints
without test-slice routing parameters.

## Run the sample

Use a supported Node.js version (Node 22 LTS is recommended). From the public
MSAL.js repository root:

```bash
npm install
npm run build:all --workspace=lib/msal-browser
cd samples/msal-browser-samples/PocdSample
npm run generate:certs
npm start
```

The two HTTPS servers share the generated, gitignored localhost certificate:

-   **MSAL app:** <https://localhost:3001>
-   **Cross-origin launcher:** <https://localhost:3000>

Trust the self-signed localhost certificate for both ports before using the
sample. These ports are also used by `UntrustedTopFrameSample`; run one sample at
a time.

Open the app directly, choose GET or POST, and select **Sign in**. Then open the
launcher and select **Open the app with a cross-origin opener** to repeat the flow
with a computed negative origin check. **Sign out** ends the IdP session and
clears cached tokens. In a fresh browser context with no IdP session,
**Try prompt=none** returns `login_required` without caching tokens.

In browser developer tools, inspect the authorize request and its sign-in
document response. For POST, parameters can be split between the URL and the
form body. Report-only COOP may remain even when enforcing COOP is suppressed.

## E2E tests and CI

[test/pocd.spec.ts](test/pocd.spec.ts) retains the twelve protocol cases: GET and POST, successful
sign-in/logout and `prompt=none` rejection, and three parameter/topology
combinations (`pocd=1`, computed-zero omission, explicit `pocd=0`).

An additional UI case drives the sample's POST sign-in, sign-out, and
`prompt=none` controls end to end.

Protocol tests pre-open a real blank popup and attach ordinary Puppeteer response
listeners before MSAL navigates it. The popup retains the app as its opener, so
COOP and opener-isolation checks still exercise real browser behavior. Two
regression cases await the captured GET/POST responses only after `prompt=none`
completes; the UI case uses the sample's normal popup creation unchanged.

Successful cases assert the wire parameters, production response, enforcing COOP
policy, actual opener isolation, token acquisition/cache, logout return through
the bridge, and cache cleanup. Negative cases require `login_required` without
cached accounts or tokens. Report-only COOP never satisfies the isolation
assertion for the zero cases.

The tests also assert that authorize/logout requests omit `dc` and that
authorize responses do not identify a test slice.

```bash
npm run test:e2e -- --runInBand
```

The `PocdSample` job in [the 3P E2E pipeline](../../../.pipelines/3p-e2e.yml)
builds and runs this standalone sample. It uses the existing `e2e-test-utils`
lab credentials and CI Key Vault setup; local authenticated tests need the same
lab access as the other browser E2E samples. The `prompt=none` cases do not fetch
lab credentials.
