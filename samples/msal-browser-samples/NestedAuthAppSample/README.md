# Nested Auth App Sample

This sample demonstrates a third-party **Nested Authentication App (NAA)**
brokered through a first-party **host** app. The host may use the platform
broker when available.

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

-   **hostApp** — the top-level host. It initializes MSAL with the platform
    broker enabled by default and embeds the nested app in an iframe. It also
    supplies the `nestedAppAuthBridge` used by the nested app.
-   **nestedApp** — the embedded child. It creates its client with
    `createNestablePublicClientApplication()` and acquires tokens through the
    host bridge. The host bridge does not return a refresh token to the nested
    app.

## The NAA bridge

The nested app talks to the host through `window.nestedAppAuthBridge`. In a
production NAA host such as Teams or Outlook, the platform injects that bridge.
In this sample, the host supplies its own implementation in
`hostApp/src/nestedAppAuthBridge.js`.

-   **Injection** — after MSAL initializes, the host calls
    `installHostNestedAppAuthBridge(hostPca, nestedOrigin)` from
    `hostApp/src/index.jsx`. The bridge only accepts `postMessage` requests from
    the nested app's origin.
-   **Usage** — `createNestablePublicClientApplication()` detects the bridge
    and routes nested token requests through it. The host brokers those requests
    through its own MSAL instance using the nested application's client ID as
    `embeddedClientId`.

## Configure the app registrations

Create linked host and nested app registrations for Nested App Authentication.
Register the following SPA redirect URIs:

-   Host app: `https://localhost:30663`
-   Nested app: `brk-multihub://localhost:30667`

For manual runs, create a local `.env` file:

| Variable                | Value                              |
| ----------------------- | ---------------------------------- |
| `VITE_HOST_CLIENT_ID`   | Application ID of the host app.    |
| `VITE_NESTED_CLIENT_ID` | Application ID of the nested app.  |
| `VITE_AUTHORITY`        | Authority URL for the test tenant. |

The automated tests use the registrations in `.env.e2e`. Do not replace or
commit changes to that file for manual runs.

## Run the sample

From the repository root:

```bash
npm install
```

From this directory:

```bash
npm install
npm run build:package
npm start
```

The sample starts:

-   Host app: `http://localhost:30663`
-   Nested app: `http://localhost:30667`

To run both apps over HTTPS:

```bash
npm run start:https
```

The browser warning for the locally generated development certificate is
expected.

## Run the end-to-end tests

| Spec                               | Command                        |
| ---------------------------------- | ------------------------------ |
| `naa-basic.spec.ts`                | `npm run test:e2e:naa-basic`   |
| `naa-kmsi.spec.ts`                 | `npm run test:e2e:kmsi`        |
| `naa-ear.spec.ts`                  | `npm run test:e2e:ear`         |
| `naa-platform-broker.spec.ts`      | `npm run test:e2e:broker`      |
| `naa-ear-platform-broker.spec.ts`  | `npm run test:e2e:ear-broker`  |
| `naa-kmsi-platform-broker.spec.ts` | `npm run test:e2e:kmsi-broker` |

Run the suites individually because each suite manages the same HTTPS server
ports.

The platform-broker suites require:

-   A WAM-enabled Windows machine.
-   `HKLM\SOFTWARE\Policies\Microsoft\BrowserCore\EnablePlatformAuth` set to
    `1`.
-   Chrome for Testing configured through `CHROME_FOR_TESTING_PATH`.
-   The unpacked Microsoft SSO extension configured through
    `SSO_EXTENSION_PATH`.
-   A brokerable Windows account. The KMSI suite requires persistent sign-in.

The Jest setup starts the HTTPS sample servers automatically.
