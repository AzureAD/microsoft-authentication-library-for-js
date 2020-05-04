# Microsoft Authentication Library for JavaScript for Node(msal-node) for Node.js based Web apps

Currently `msal-node` library is under development, Please track the project progress [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/projects/4).
### Build Library

```javascript
// Change to the msal-node package directory
cd lib/msal-node/

// Ensure you are using the local build of msal-common
npm link @azure/msal-common

// To run build only for node package
npm run build
```
TBD: Add lerna bootstrap to build common/node in one step

## Local Development

Below is a list of commands you will probably find useful.

### `npm start`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab.

<img src="https://user-images.githubusercontent.com/4060187/52168303-574d3a00-26f6-11e9-9f3b-71dbec9ebfcb.gif" width="600" />

Your library will be rebuilt if you make edits.

### `npm run build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

<img src="https://user-images.githubusercontent.com/4060187/52168322-a98e5b00-26f6-11e9-8cf6-222d716b75ef.gif" width="600" />

### `npm run lint`

Runs eslint with Prettier

### `npm test`, `npm run test:coverage`, `npm run test:watch`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
Generate code coverage by adding the flag --coverage. No additional setup needed. Jest can collect code coverage information from entire projects, including untested files.

## TSDX Bootstrap

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

