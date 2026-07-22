# Nested App Authentication (NAA) Platform-Broker Test App

This sample demonstrates **Nested App Authentication (NAA)** brokered through the
**platform broker** (JS-WAM / Web Account Manager). It is used by the end-to-end
brokering test suite to validate NAA token acquisition.

> NAA and Pairwise Broker are **mutually-exclusive** brokering modes of the same
> protocol — they can never be enabled together. The Pairwise Broker equivalent
> of this harness lives in the 1P repo at `samples/BrokerTestApp-React`.

## Architecture

```
 hostApp (top frame, port 30668)              nestedApp (iframe, port 30667)
 ┌──────────────────────────────────┐         ┌──────────────────────────────┐
 │ @azure/msal-browser              │         │ @azure/msal-browser          │
 │ PublicClientApplication          │  NAA    │ createNestablePublicClient   │
 │  system.allowPlatformBroker:true │◀────────│  Application()               │
 │  auth.supportsNestedAppAuth:true │ bridge  │  (talks to host via          │
 │                                  │         │   window.nestedAppAuthBridge)│
 │ relays to the platform broker ───┼──▶ WAM  │                              │
 └──────────────────────────────────┘         └──────────────────────────────┘
```

-   **hostApp** — the top-level host. It initializes MSAL with the **platform
    broker** enabled (`system.allowPlatformBroker: true`) and advertises itself as
    an NAA host (`auth.supportsNestedAppAuth: true`). It embeds the nested app in
    an iframe and exposes the `nestedAppAuthBridge` that the nested app talks to.
    Token requests from the nested app are relayed to the platform broker.
-   **nestedApp** — the embedded child. It creates its client with
    `createNestablePublicClientApplication()` and acquires tokens **through the
    host bridge**, never contacting the identity provider directly.

The platform broker (WAM) provides the actual brokered token acquisition. In CI
this requires the browser-side platform-broker bridge to be present (see the
repo `chrome-extension/`); running locally requires a machine with the platform
broker available.

## Structure

| Path         | Description                                                    |
| ------------ | -------------------------------------------------------------- |
| `server.js`  | Spawns the `hostApp` and `nestedApp` vite dev servers.         |
| `hostApp/`   | Top-frame host app (platform broker + NAA host).               |
| `nestedApp/` | Embedded nested app (`createNestablePublicClientApplication`). |
| `test/`      | Jest + Puppeteer end-to-end specs.                             |

## Running the sample

```bash
# From this directory
npm install
npm run build:package   # build @azure/msal-browser and @azure/msal-react
npm start               # hostApp -> http://localhost:30668
```

## Running the end-to-end tests

```bash
npm run test:e2e
```

The e2e specs consume the shared brokering helpers published from
`samples/e2eTestUtils` (Foundation PR 1).
