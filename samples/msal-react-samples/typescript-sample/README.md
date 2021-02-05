# MSAL.js for React Typescript Sample - Authorization Code Flow in Single-Page Applications

## About this sample

This developer sample is used to run basic use cases for the MSAL library. You can also alter the configuration in `./src/authConfig.ts` to execute other behaviors.
This sample was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## How to run the sample

### Pre-requisites

- Ensure [all pre-requisites](../../../lib/msal-react/README.md#prerequisites) have been completed to run msal-react.
- Install node.js if needed (<https://nodejs.org/en/>).

### Configure the application

- Open `./src/authConfig.ts` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration.
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.
- If you are using this sample on it's own (without local builds of `msal-react` and `msal-browser`) you will also need to update the `package.json` file to specify the versions of `@azure/msal-react`, `@azure/msal-browser`, `react` and `react-dom` you would like to use.

#### Install npm dependencies for sample

##### Installing @azure/msal-react and @azure/msal-browser from local builds

```bash
# Install dev dependencies for msal-react and msal-browser from root of repo
npm install

# Change directory to sample directory
cd samples/msal-react-samples/nextjs-sample

# Build packages locally
npm run build:package

# Install local libs
npm run install:local

# Install sample dependencies
npm install
```

Note: If you suspect you are not using the local builds check that the `package.json` file shows the following dependencies:

```
"@azure/msal-react": "file:../../../lib/msal-react",
"@azure/msal-browser": "file:../../../lib/msal-browser",
"react": "file:../../../lib/msal-react/node_modules/react",
"react-dom": "file:../../../lib/msal-react/node_modules/react-dom",
```

##### Installing @azure/msal-react and @azure/msal-browser from released versions available on npm

```bash
# Change directory to sample directory
cd samples/msal-react-samples/nextjs-sample

# Install packages from npm
npm run install:published

# Install rest of dependencies
npm install
```

#### Running the sample

1. In a command prompt, run `npm start`.
1. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

- In the web page, click on the "Sign In" button and select either `Sign in using Popup` or `Sign in using Redirect` to begin the auth flow.

#### Learn More about Create React App

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
