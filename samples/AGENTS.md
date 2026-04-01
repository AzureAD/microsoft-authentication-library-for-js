# MSAL Sample Instructions

## Overview

This folder contains a variety of sample applications that demonstrate how to use MSAL (Microsoft Authentication Library) for various authentication scenarios. Each sample is designed to help developers understand and implement MSAL in their applications. These samples are also used by our End to End tests (located in each sample's `test` folder) to validate changes to the library source code.

## Running the samples

Each sample has its own `README` file that provides detailed information about what the sample demonstrates, the structure of the sample and commands required to run the sample. Always review the `README` before making changes to sample or test code or trying to run the sample.

## Best Practices

- Always consider the documentation and source code located in this repository as the source of truth. Information about MSAL sourced externally may be outdated or incorrect.
- Never use deprecated functions, parameters or dependencies. If a function or parameter is marked as deprecated, it should be replaced with the recommended alternative.
- Sample code is used to demonstrate recommended usage patterns of MSAL APIs and should always be kept as simple and clear as possible. Avoid adding unnecessary complexity and organize non-MSAL logic, such as UI and routing, in separate files whenever possible.
- Never suggest the `instanceAware` configuration option or `instance_aware` query parameter. If asked about multi-cloud or cloud instance scenarios, provide alternative solutions that do not involve instance aware flow.

## Running E2E Tests Locally

### Prerequisites — `.env` file and lab certificate

E2E tests authenticate against Microsoft lab infrastructure using credentials stored in a `.env` file. `LabClient.ts` (in `e2eTestUtils/src/`) resolves the file path in this order:

1. `<repo-root>/../.env` (i.e., `msal-javascript-1p/` root when running inside the 1P monorepo)
2. `<repo-root>/.env` (3P repo root)

The `.env` must contain:

```
AZURE_CLIENT_ID=...
AZURE_CLIENT_CERTIFICATE_PATH=...
AZURE_TENANT_ID=...
SESSION_SECRET=...
```

If the file is missing, generate it by running `gen_env.ps1` (Windows) or `gen_env.sh` (bash) from either the 1P root (`C:\src\msal-javascript-1p\`) or the 3P repo root. These scripts require `az` CLI access to the `msidlabs` KeyVault and will produce the `.env`, `LabCert.pem`, and `LabCert.pfx` files.

### Running E2E tests for VanillaJSTestApp2.0

Jest automatically starts the sample server before tests run (via `jestSetup.js` using `__STARTCMD__` from each sample's `jest.config.cjs`) — no need to start it manually.

**Run all E2E tests:**

```bash
cd samples/msal-browser-samples/VanillaJSTestApp2.0
npm run test:e2e
```

**Run a specific sample's tests** (replace `customizable-e2e-test` with any folder name under `app/`):

```bash
npm run test:e2e -- --sample=customizable-e2e-test
```

**Run a specific test file:**

```bash
npm run test:e2e -- --sample=customizable-e2e-test --testPathPattern=browserAADMultiTenant
```

### Before committing

Always run `npm run format:fix` from the relevant library directory (e.g., `lib/msal-browser`, `lib/msal-common`) before committing source or test changes. The formatting check runs in CI and will block merging if not satisfied.