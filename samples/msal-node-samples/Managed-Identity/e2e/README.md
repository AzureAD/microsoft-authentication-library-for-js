# Managed Identity E2E tests (msal-node)

Real, end-to-end **Managed Identity** token-acquisition tests for `@azure/msal-node`.
Unlike the demos under [`../Imds`](../Imds) and [`../FIC`](../FIC), this package makes
**live** token requests and asserts on the result, so it only does meaningful work on
the self-hosted Azure DevOps pools that are actual Azure VM / Azure Arc machines with
the lab managed identities assigned. Everywhere else the suites self-skip.

These tests mirror the MSAL Go and MSAL Python Managed Identity E2E tests and use the
**same** lab identities and ARM resource (`https://management.azure.com`), so every SDK
exercises the same lab configuration on the same machines.

## What it covers

| Pool (source)                         | Identities exercised                                                 |
| ------------------------------------- | -------------------------------------------------------------------- |
| `MISEManagedIdentity` (Azure VM/IMDS) | system-assigned + user-assigned by client id, object id, resource id |
| `MISEAZUREARC` (Azure Arc)            | system-assigned only (Azure Arc does not support user-assigned)      |

Each test acquires an ARM token twice and asserts:

1. the first call reaches the identity provider (`fromCache === false`);
2. the second call is served from the token cache (`fromCache === true`);
3. the two tokens match (compared by SHA-256 digest so token material never reaches CI logs).

## How the suites are gated

-   **IMDS** runs only when `MSAL_TEST_MI_IMDS` is set (the IMDS pipeline stage sets it).
    A hosted agent also reports the IMDS source, so an explicit flag is used rather than
    source detection.
-   **Azure Arc** runs only when `ManagedIdentityApplication.getManagedIdentitySource()`
    detects Azure Arc on the machine.

## Building from source

This package depends on the workspace `@azure/msal-node` (and, via an `overrides` entry,
`@azure/msal-common`) through `file:` references, so the tests validate the **repo source**
rather than a published package:

```bash
# from this directory
npm run build:package   # builds @azure/msal-common + @azure/msal-node from source
npm install             # installs the just-built libraries + test dependencies
npm run test:e2e        # runs the tests (self-skips off-pool)
```

The [`managed-identity-e2e` pipeline](../../../../.pipelines/managed-identity-e2e.yml)
runs these steps automatically on the two self-hosted pools.
