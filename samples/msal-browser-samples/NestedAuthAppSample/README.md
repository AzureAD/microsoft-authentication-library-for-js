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
| `test/`      | Jest + Puppeteer end-to-end specs.                     |

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

The end-to-end test exercises Nested App Authentication through the
**host-supplied** `window.nestedAppAuthBridge`: the host app brokers the nested
app's token over the regular web flow, and the test asserts the nested app never
holds a refresh token (the core NAA property).

End-to-end tests must run over HTTPS. The Jest configuration starts the HTTPS
servers automatically.

```bash
npm run test:e2e
```

The e2e specs consume the shared browser, cache, credential, and screenshot
utilities from `samples/e2eTestUtils`.
