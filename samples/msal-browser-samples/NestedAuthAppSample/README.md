# Nested Auth App Sample

This sample demonstrates a 3P **Nested Authentication App (NAA)** brokered through a 1P **Host** app. The Host app may choose to get tokens through the platform broker when available.

## Architecture

```text
 hostApp (top frame, port 30668)              nestedApp (iframe, port 30667)
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

## Structure

| Path         | Description                                            |
| ------------ | ------------------------------------------------------ |
| `server.js`  | Spawns the `hostApp` and `nestedApp` vite dev servers. |
| `hostApp/`   | Top-frame host app (platform broker + NAA host).       |
| `nestedApp/` | Embedded nested app.                                   |
| `test/`      | Jest + Puppeteer end-to-end specs.                     |


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
npm start               # hostApp -> http://localhost:30668
```

To serve both apps over HTTPS with locally generated development certificates:

```bash
npm run start:https     
# hostApp -> https://localhost:30668
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
