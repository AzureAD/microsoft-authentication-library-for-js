# Nested Auth App Sample

This sample demonstrates a 3P **Nested Authentication App (NAA)** brokered through a 1P **Host** app. The Host app may choose to get tokens through the platform broker when available.

## Architecture

```text
 hostApp (top frame, port 30663)              nestedApp (iframe, port 30667)
 ┌──────────────────────────────────┐         ┌──────────────────────────────┐
 │ @azure/msal-browser              │         │ @azure/msal-browser          │
 │ PublicClientApplication          │  NAA    │ createNestablePublicClient   │
 │  system.allowPlatformBroker:true │◀────────│  Application()               │
 │                                  │ bridge  │                              │
 │ relays to the platform broker    │         │                              │
 └────────────────┬─────────────────┘         └──────────────────────────────┘
                  │
                  ▼
                 WAM
```

-   **hostApp** — the top-level host. It initializes MSAL with the **platform
    broker** enabled (`system.allowPlatformBroker: true`) and embeds the nested
    app in an iframe. Also supplies the `nestedAppAuthBridge` used by the nested app.
-   **nestedApp** — the embedded child. It creates its client with
    `createNestablePublicClientApplication()` and acquires tokens **through the
    host bridge**, never contacting the identity provider directly.

## The NAA bridge

The nested app talks to the host through `window.nestedAppAuthBridge`. In a
production NAA host (Teams, Outlook) that bridge is injected by the platform;
in this sample the host app supplies its own implementation
(`hostApp/src/nestedAppAuthBridge.js`).

-   **Injection** — the host installs the bridge on `window` by calling
    `installHostNestedAppAuthBridge(hostPca, nestedOrigin, brokerExtraParams)`
    from `hostApp/src/index.jsx` after MSAL initializes. The bridge only accepts
    `postMessage` requests from the nested app's origin.
-   **Usage** — the nested app creates its client with
    `createNestablePublicClientApplication()`, which detects the bridge and
    routes `acquireTokenSilent` / `acquireToken` calls through it. The host
    receives those requests and brokers the token via its **own** MSAL instance,
    passing the nested app's client id as MSAL's `embeddedClientId` request
    parameter so the host acts as the broker.


## Structure

| Path         | Description                                            |
| ------------ | ------------------------------------------------------ |
| `sampleConfig.cjs` | Single source of truth for the host/nested app ports.  |
| `server.js`  | Spawns the `hostApp` and `nestedApp` vite dev servers. |
| `hostApp/`   | Top-frame host app (platform broker + NAA host).       |
| `nestedApp/` | Embedded nested app.                                   |
| `test/`      | Jest end-to-end specs (Puppeteer for the web flow, Playwright for the platform broker). |

The host and nested app ports are defined once in `sampleConfig.cjs` and
imported everywhere they are needed (`server.js`, both `vite.config.js` files,
the Jest config, and the e2e setup/spec). The host app receives the nested
app's port and protocol at runtime from `server.js` via the
`VITE_NESTED_APP_PORT` / `VITE_NESTED_APP_PROTOCOL` environment variables, so
changing a port only requires editing `sampleConfig.cjs`.


### Registering the apps for NAA

For the **NAA** flow, register the app pair on Azure Portal as follows.

**Identify:**

-   **Nested app** — the embedded (nested) application.
-   **Broker app** — the application hosting the client (the host app).

On the **nested app**, register a SPA reply URI by replacing the normal reply URI's scheme with `brk-multihub://`. **Broker app** SPA reply URI stays the same.

Normal nested app reply URI:

```
https://localhost:30667
```

Registered multi-hub reply URI:

```
brk-multihub://localhost:30667
```

### Configuring the app registrations

The sample ships with placeholder values only — no app registrations are
provided. Before running, edit `.env` (used by `npm start` / `npm run
start:https`) and, if you run the e2e tests, `.env.e2e`, replacing the
placeholders with your own registrations:

| Variable                | Value                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `VITE_HOST_CLIENT_ID`   | Application (client) id of the **host/broker** app.               |
| `VITE_NESTED_CLIENT_ID` | Application (client) id of the **nested** app.                    |
| `VITE_AUTHORITY`        | Authority URL, e.g. `https://login.microsoftonline.com/<tenant>`. |

For the **NAA + EAR** tests only, the following optional variables in `.env.e2e`
point at an **EAR-enabled** registration pair. When left unset the standard
registrations above are reused (and must themselves have EAR enabled):

| Variable                    | Value                                                    |
| --------------------------- | -------------------------------------------------------- |
| `VITE_EAR_HOST_CLIENT_ID`   | Client id of an **EAR-enabled host/broker** app.         |
| `VITE_EAR_NESTED_CLIENT_ID` | Client id of an **EAR-enabled nested** app.              |
| `VITE_EAR_AUTHORITY`        | EAR authority URL (defaults to `VITE_AUTHORITY`).        |

## Running the sample

```bash
# From the repository root
npm install

# Then from this directory
npm install
npm run build:package   # build the in-repo @azure/msal-browser package
npm start               # hostApp -> http://localhost:30663
```

To serve both apps over HTTPS with locally generated development certificates:

```bash
npm run start:https     
# hostApp -> https://localhost:30663
# nestedApp -> https://localhost:30667
```

The browser will warn that the development certificate is untrusted. This is
expected for local use.

## Running the end-to-end tests

The end-to-end suites live in `test/` and cover two host configurations, each of
which also has an **Encrypted Authorize Response (EAR)** combination variant:

| Spec / suite | Host flow | Runs in CI? | Command |
| ------------ | --------- | ----------- | ------- |
| `naa-basic.spec.ts` — base | Web flow (Puppeteer) | Yes (`naa-basic` filter) | `npm run test:e2e:basic` |
| `naa-basic.spec.ts` — EAR | Web flow + `ProtocolMode.EAR` | No (opt-in) | `npm run test:e2e:ear` |
| `naa-platform-broker.spec.ts` — base | Platform broker / WAM (Playwright) | No (self-hosted) | `npm run test:e2e:broker` |
| `naa-platform-broker.spec.ts` — EAR | Platform broker + `ProtocolMode.EAR` | No (self-hosted) | `npm run test:e2e:ear-broker` |

The base suites exercise Nested App Authentication through the **host-supplied**
`window.nestedAppAuthBridge`: the host brokers the nested app's token and the
test asserts the nested app never holds a refresh token (the core NAA property).

The **EAR** suites open the host with `?ear=true` so it runs in
`ProtocolMode.EAR`; the host's login and the token it brokers for the nested app
come back as an encrypted `ear_jwe`. A `crypto.subtle.decrypt` spy asserts the
response was actually decrypted (i.e. EAR was used, not a plaintext auth-code
fallback). The EAR combination in `naa-basic.spec.ts` is gated behind
`NAA_EAR_E2E=true` (set in `.env.e2e`, only reaching jest via `npm run
test:e2e:ear`) so it stays **skipped in CI**, where no EAR registration exists.

The platform-broker suites are **self-hosted only**: they require branded
Chrome, the Microsoft SSO extension, WAM, and a brokerable signed-in Windows
account, so they are excluded from CI by the `naa-basic` pipeline filter.

End-to-end tests must run over HTTPS. The Jest configuration starts the HTTPS
servers automatically.

```bash
npm run test:e2e        # every suite (base + EAR, web + broker)
```

The e2e specs consume the shared browser, cache, credential, and screenshot
utilities from `samples/e2eTestUtils`.
