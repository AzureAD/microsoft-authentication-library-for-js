# Migrating from MSAL React v3 to v5

Note: There is no MSAL React v4 release. The package version was incremented from v3 directly to v5 to align `msal-react` versioning with the other MSAL.js libraries. No separate v4 feature set exists.

Please see the [MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md) for browser support and other key changes.

## Migration paths

- **v3 -> v5**: Follow this guide, then apply the [MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md), especially the redirect bridge setup.
- **v1/v2 -> v5**: The v1 -> v2 and v2 -> v3 updates were peer dependency version updates only for most apps. Move to v3 first, then follow the v3 -> v5 guidance in this document plus redirect bridge setup.

## Redirect bridge setup (required)

MSAL Browser v5 requires a dedicated redirect page/bridge for authentication flows.

Please see the [COOP section in the MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md#cross-origin-opener-policy-coop-support).

## Updated React version support
MSAL React v5 supports React 16.8.0 or greater through React 19.x. This includes React 16 (16.8+), 17, 18, and 19.

## Peer dependency ranges

MSAL React v5 declares its `react` peer dependency as `">=16.8.0 <20.0.0"`. This means:

- Applications using React 16.8 or newer (including 17.x, 18.x, and 19.x) will satisfy the peer dependency without errors or warnings.
- No `--legacy-peer-deps` flag is required for any supported version.

### Known considerations

- **React 16/17 note**: React hooks are required. Minimum supported version is React 16.8.0.
- **`@types/react`**: If you use TypeScript, install the `@types/react` version matching your React major version (`@types/react@^16` for React 16, `@types/react@^17` for React 17, `@types/react@^18` for React 18, `@types/react@^19` for React 19). All are compatible with the MSAL React v5 public API surface.
- **`@testing-library/react`**: v12 supports React 16/17; v14+ supports React 18; v16+ supports both React 18 and 19. Choose the version that matches your React version.
- **`react-dom`**: Install the same major version of `react-dom` as `react` (e.g., `react-dom@^16` with `react@^16`).
- **Rendering API**: React 16 and 17 use `ReactDOM.render()`. React 18+ uses `createRoot()`. MSAL React itself does not call either API — your application chooses the rendering method.

## Migrating from Create React App (react-scripts)

Create React App is deprecated and `react-scripts` does not support React 19. If your app uses `react-scripts`, you should migrate to a different build tool before upgrading to `@azure/msal-react@^5`. While React 18 is supported by `@azure/msal-react@^5`, CRA is no longer maintained and Vite is recommended.

**Recommended: Migrate to [Vite](https://vite.dev/)**

1. Remove `react-scripts` and install Vite + the React plugin:
    ```bash
    npm uninstall react-scripts
    npm install --save-dev vite @vitejs/plugin-react
    ```

2. Add `"type": "module"` to `package.json`.

3. Move `public/index.html` to the project root as `index.html`, replace `%PUBLIC_URL%/` references with `/`, and add the entry point script tag:
    ```html
    <!-- Before (CRA): no script tag needed, CRA injects it -->
    <!-- After (Vite): add before </body> -->
    <script type="module" src="/src/index.jsx"></script>
    ```

4. Create a `vite.config.js` at project root:
    ```js
    import { defineConfig } from "vite";
    import react from "@vitejs/plugin-react";
    import { resolve } from "path";

    export default defineConfig({
        plugins: [react()],
        server: {
            port: 3000,
        },
        build: {
            rollupOptions: {
                input: {
                    main: resolve(__dirname, "index.html"),
                    redirect: resolve(__dirname, "public/redirect.html"),
                },
            },
        },
    });
    ```

5. Update `package.json` scripts:
    ```json
    "scripts": {
        "start": "vite",
        "build": "vite build",
        "preview": "vite preview"
    }
    ```

6. Replace `process.env.REACT_APP_*` references with `import.meta.env.VITE_*` and rename environment variables accordingly (e.g. `REACT_APP_CLIENT_ID` → `VITE_CLIENT_ID`).

7. Remove CRA-specific environment variables (`SKIP_PREFLIGHT_CHECK`, `DISABLE_ESLINT_PLUGIN`) from `.env` files.

8. Upgrade React (if needed) and install MSAL:
    ```bash
    # React 19 (recommended)
    npm install react@^19.2.1 react-dom@^19.2.1
    # OR React 18 (also supported)
    npm install react@^18.0.0 react-dom@^18.0.0
    # Then install MSAL
    npm install @azure/msal-browser@^5 @azure/msal-react@^5
    ```

9. Set up the [redirect bridge](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/redirect-bridge.md#vite) for your Vite app.

> **Samples:** See the [react-router-sample](../../../samples/msal-react-samples/react-router-sample), [typescript-sample](../../../samples/msal-react-samples/typescript-sample), and [b2c-sample](../../../samples/msal-react-samples/b2c-sample) for complete Vite-based examples.

## Correct logout bug
MSAL React v5 has fixed a bug affecting the `useMsalAuthentication` hook and `MsalAuthenticationTemplate`. Logging out now clears all state associated with the user.

## `InteractionStatus` changes
For `InteractionStatus`: `Login`, `SsoSilent`, and `AcquireToken` are now consolidated into `AcquireToken`.

### Migration example

If your app previously checked multiple in-progress statuses, simplify to the consolidated `AcquireToken` status.

```ts
import { InteractionStatus } from "@azure/msal-browser";

// Before (v3-style checks)
const tokenInteractionInProgress =
	inProgress === InteractionStatus.Login ||
	inProgress === InteractionStatus.SsoSilent ||
	inProgress === InteractionStatus.AcquireToken;

// After (v5)
const tokenInteractionInProgress =
	inProgress === InteractionStatus.AcquireToken;

if (!tokenInteractionInProgress) {
	// safe to initiate a new auth/token request
}
```