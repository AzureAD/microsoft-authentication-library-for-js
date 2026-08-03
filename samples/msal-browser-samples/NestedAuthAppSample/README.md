# Nested Auth App Sample

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
 │                                  │ bridge  │  (talks to host via          │
 │                                  │         │   window.nestedAppAuthBridge)│
 │ relays to the platform broker ───┼──▶ WAM  │                              │
 └──────────────────────────────────┘         └──────────────────────────────┘
```

-   **hostApp** — the top-level host. It initializes MSAL with the **platform
    broker** enabled (`system.allowPlatformBroker: true`) and embeds the nested
    app in an iframe. The WAM-enabled browser environment supplies the
    `nestedAppAuthBridge` used by the nested app.
-   **nestedApp** — the embedded child. It creates its client with
    `createNestablePublicClientApplication()` and acquires tokens **through the
    host bridge**, never contacting the identity provider directly.

The platform broker (WAM) provides the actual brokered token acquisition. In CI
this requires the browser-side platform-broker bridge to be configured by the
test environment; running locally requires a machine with the platform broker
available.

The host and nested apps require separate app registrations. Set
`VITE_HOST_APP_CLIENT_ID` and `VITE_NESTED_APP_CLIENT_ID` to those client IDs;
the checked-in defaults are distinct placeholders.

## Structure

| Path         | Description                                                    |
| ------------ | -------------------------------------------------------------- |
| `server.js`  | Spawns the `hostApp` and `nestedApp` vite dev servers.         |
| `hostApp/`   | Top-frame host app (platform broker + NAA host).               |
| `nestedApp/` | Embedded nested app (`createNestablePublicClientApplication`). |
| `test/`      | Jest + Puppeteer end-to-end specs.                             |

## Running the sample

```bash
# From the repository root
npm install

# Then from this directory
npm install
npm run build:package   # build the in-repo @azure/msal-browser package
npm start               # hostApp -> http://localhost:30668
```

## Running the end-to-end tests

```bash
npm run test:e2e
```

The e2e specs consume the shared browser, cache, credential, and screenshot
utilities from `samples/e2eTestUtils`.
