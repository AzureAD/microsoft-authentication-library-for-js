# MSAL React sample app

This application is a sample for the [MSAL React POC](./src/msal-react).

## Setup

1. Run `npm install` in this folder.
2. It is recommended to use the local versions of `@azure/msal-browser` and `@azure/msal-common`:
3. Run `lerna bootstrap` to create symlinks to the local versions.
4. Ensure both `msal-browser` and `msal-common` are built by running `npm run build` in each folder.
5. Optionally, run `npm run build:modules:watch` in each library to pick up local changes automatically.
6. Start the sample using `npm start`. See the [Create React App README](./CRA_README) for details.

## Documentation

Documentation for the MSAL React POC is available [here](./src/msal-react/README.md).

## APIs

This sample demonstrates usage of the following APIs:

- `MsalProvider`
- `MsalConsumer`
- `withMsal`
- `AuthenticatedComponent`
- `UnauthenticatedComponent`
- `useHandleRedirect`
