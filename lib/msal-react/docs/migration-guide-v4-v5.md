# Migrating from MSAL React v3 to v5

Note: There is no MSAL React v4 release. The package version was incremented from v3 directly to v5 to align `msal-react` versioning with the other MSAL.js libraries. No separate v4 feature set exists.

Please see the [MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md) for browser support and other key changes.

## Migration paths

- **v3 -> v5**: Follow this guide, then apply the [MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md), especially the redirect bridge setup.
- **v1/v2 -> v5**: The v1 -> v2 and v2 -> v3 updates were peer dependency version updates only for most apps. Move to v3 first, then follow the v3 -> v5 guidance in this document plus redirect bridge setup.

## Redirect bridge setup (required)

MSAL Browser v5 requires a dedicated redirect page/bridge for authentication flows.

Please see the [COOP section in the MSAL Browser v4-v5 migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md#cross-origin-opener-policy-coop-support).

## Dropped support for old React versions
MSAL React v5 supports React 19.2.1 or greater. It no longer supports React 16, 17, or 18.

## React 18 compatibility note

If your app is still on React 18, installing `@azure/msal-react@^5` may fail due to peer dependency constraints.

- Temporary install workaround: `npm install --legacy-peer-deps`
- This may allow installation and basic flows may continue to work in some apps, but React 18 is not supported or validated for v5
- You may see untested behavior around rendering/lifecycle timing, StrictMode interactions, or future patch updates

For production workloads, upgrade React to 19.2.1 or greater before moving to `@azure/msal-react@^5`.

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