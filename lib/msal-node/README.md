# Microsoft Authentication Library for Node

The MSAL Node library allows Node.js libraries to authenticate users using Azure AD work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity prociders like Facebook, Google, Linkedin, Microsoft, through Azure B2C. It also enables your app to get tokens to access protected resources.

Currently `msal-node` library is under development, Please track the project progress [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/projects/4).

### Build Library
- If you don't have [lerna](https://github.com/lerna/lerna) installed, run `npm install -g lerna`
- Run `lerna bootstrap` from anywhere within `microsoft-authentication-library-for-js.git`.
- Navigate to `microsoft-authentication-library-for-js/lib/msal-common` and run `npm run build`
- Navigate to `microsoft-authentication-library-for-js/lib/msal-node` and run `npm run build`

## Local Development

Below is a list of commands you will probably find useful.

### `npm run build:modules:watch`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab. The library will be rebuilt if you make edits.

### `npm run build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

### `npm run lint`

Runs eslint with Prettier

### `npm test`, `npm run test:coverage`, `npm run test:watch`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
Generate code coverage by adding the flag --coverage. No additional setup needed. Jest can collect code coverage information from entire projects, including untested files.

## Samples

There are multiple samples included in the repository that use MSAL Node to acquire tokens. The samples are currently used for manual testing, and are not meant to be a reference of best practices, therefore use judgement and do not blindly copy this code to any production applications.

- `msal-node-auth-code`: Express app using OAuth2.0 authorization code flow.
- `msal-node-device-code`: Command line app using OAuth 2.0 device code flow.
- `msal-node-refresh-token`: Command line app using OAuth 2.0 refresh flow.
- `msal-node-extensions`: Uses the msal-extensions library to write the MSAL in-memory token cache to a disk.
