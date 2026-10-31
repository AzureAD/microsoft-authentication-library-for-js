---
generated-by: Forge/Coder
---

# Web Native Bridge Token Sample

A browser host runs the [Windows sample's child UI](../NativeBridgeTokenSample/README.md) through the [MSAL Bridge transport](../../../lib/msal-bridge/README.md). The browser host owns NAA dispatch and uses a public MSAL.js web executor. It does not execute OneAuth, WAM, or the .NET native boundary.

## Configuration

[settings.json](settings.json) preserves the tested POC tenant/client IDs, host and child origins, exact redirects, scopes, inactive first slot, `registrationConfirmed: true` and `testSlice` routing. These are real lab identifiers and routing settings, not credentials. Keep this file when reproducing that environment; inclusion does not grant account access, consent or service authorization, or guarantee that another account can authenticate. No client secret is needed or permitted in browser settings.

[settings.example.json](settings.example.json) remains a template with placeholder tenant/client GUIDs and `registrationConfirmed: false` for other environments. With that template, startup is allowed but authentication is blocked with `registration_not_confirmed` until you configure and verify your own registrations.

The example host is `https://localhost:30663` with the root callback. App 2 is `https://localhost:7445` with redirect `brk-multihub://localhost:7445`. The first slot is inactive and creates no iframe or authentication session. Configure a distinct client ID, origin, redirect and scopes before activating it; inactive fields must remain empty.

Use your own tenant, distinct host/child public-client registrations, exact redirect URIs and applicable broker/service associations. `brk-multihub` requires service support; this sample does not install a handler or authorize a broker. A local allowlist cannot enable unsupported registrations. Omit optional test routing unless authorized.

Settings precedence: explicit `--settings PATH`, included sample-root `settings.json`, then the example. Missing explicit files fail. For a different environment, use a separate settings file and set `registrationConfirmed` only after independently verifying configuration. Do not overwrite the included lab settings with the example. Never commit credentials or TLS private keys.

## Run

Requirements: Node 22+, npm, built MSAL common/browser/bridge packages, free configured ports, and an owner-approved HTTPS certificate covering localhost. From the repository root:

```powershell
npm install
npm run build --workspace=@azure/msal-common
npm run build:debug --workspace=@azure/msal-browser
npm run build --workspace=@azure/msal-bridge
cd samples/msal-browser-samples/WebNativeBridgeTokenSample
npm start -- --settings settings.json --cert C:\certs\localhost-cert.pem --key C:\certs\localhost-key.pem --open
```

Use the included lab settings only with the applicable account and service authorization, or pass your own verified settings file before signing in. Staging copies built assets and the sibling Windows sample's child UI, without installing dependencies or building native code. `THREE_P_REPO` optionally selects another already-built MSAL.js checkout; this checkout is the default.

Supply both PEM files. Establish browser trust deliberately through your approved development process; do not bypass certificate validation or automatically install trust. Missing TLS inputs and occupied ports fail without HTTP fallback or port substitution. Listeners bind only to loopback and validate the configured Host header.

Select **Sign In Host**, then a child's interactive or silent token command. Graph is a separate action after acquisition. Silent acquisition never opens a popup automatically. **Reset Session** clears local state, not identity-provider cookies. UI source changes need a reload; settings and server changes need a server restart.

## Security And Limits

The host validates exact frame source/origin and binds each session to a challenge, nonce and epoch. Fixed configuration controls child identity, authority, redirect and scopes. Size, concurrency, replay, rate and deadline limits remain enforced. An origin check does not attest document paths; serve only trusted content on these origins.

The web executor uses public PCA popup/silent APIs with host-controlled embedded-client fields, memory storage, platform brokering disabled and child token persistence disabled. Results require child-audience claims, nonempty tokens, positive expiry, matching authority/host account and requested scopes. These checks do not independently verify JWT signatures. Cancellation suppresses stale replies but cannot revoke dispatched SDK/service work.

The child inspection panes intentionally display complete serialized NAA request/response messages, including returned raw tokens. They are sensitive local displays, not HTTP captures. Do not share screenshots or paste payloads into logs. Clear the panes after inspection. Session reset/page exit clears them; payloads are not added to logs, console, telemetry or persistent storage.

Routes do not serve settings, keys or directory listings. CSP restricts framing and network access; no permissive CORS is enabled. Graph receives a bearer header only. Trusted scripts and developer tools can still inspect memory. This is a prototype, not proof of production security or native/broker interoperability.

## Validation

```powershell
npm test
npm run test:browser
```

Tests use synthetic accounts, mocked Graph/authentication and temporary listeners, not live sign-in. The retained suites cover NAA policy, executor mapping, frame/session transport and browser integration. Browser checks require Playwright and Edge; `BRIDGE_PLAYWRIGHT` can select another installed package. Generated files stay in ignored artifacts. These checks do not establish live authentication, Graph access, service authorization or native SDK interoperability.
