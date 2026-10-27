# Nested Auth App Sample

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

| Spec                               | Command                                       |
| ---------------------------------- | --------------------------------------------- |
| `naa-basic.spec.ts`                | `npm run test:e2e:naa-basic -- --runInBand`   |
| `naa-ear.spec.ts`                  | `npm run test:e2e:ear -- --runInBand`         |
| `naa-platform-broker.spec.ts`      | `npm run test:e2e:broker -- --runInBand`      |
| `naa-ear-platform-broker.spec.ts`  | `npm run test:e2e:ear-broker -- --runInBand`  |
| `naa-kmsi-platform-broker.spec.ts` | `npm run test:e2e:kmsi-broker -- --runInBand` |

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
