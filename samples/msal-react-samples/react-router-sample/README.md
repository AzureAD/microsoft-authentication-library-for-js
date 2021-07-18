# MSAL.js for React Sample - Authorization Code Flow in Single-Page Applications

## About this sample

This developer sample is used to run basic use cases for the MSAL library. You can also alter the configuration in `./src/authConfig.js` to execute other behaviors.
This sample was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Notable files and what they demonstrate

1. `./src/App.js` - Shows implementation of `MsalProvider`, all children will have access to `@azure/msal-react` context, hooks and components.
1. `./src/index.js` - Shows intialization of the `PublicClientApplication` that is passed to `App.js`
1. `./src/pages/Home.jsx` - Homepage, shows how to conditionally render content using `AuthenticatedTemplate` and `UnauthenticatedTemplate` depending on whether or not a user is signed in.
1. `./src/pages/Profile.jsx` - Example of a protected route using `MsalAuthenticationTemplate`. If a user is not yet signed in, signin will be invoked automatically. If a user is signed in it will acquire an access token and make a call to MS Graph to fetch user profile data.
1. `./src/authConfig.js` - Configuration options for `PublicClientApplication` and token requests.
1. `./src/ui-components/SignInSignOutButton.jsx` - Example of how to conditionally render a Sign In or Sign Out button using the `useIsAuthenticated` hook.
1. `./src/ui-components/SignInButton.jsx` - Example of how to get the `PublicClientApplication` instance using the `useMsal` hook and invoking a login function.
1. `./src/ui-components/SignOutButton.jsx` - Example of how to get the `PublicClientApplication` instance using the `useMsal` hook and invoking a logout function.
1. `./src/utils/MsGraphApiCall.js` - Example of how to call the MS Graph API with an access token.
1. `./src/utils/NavigationClient.js` - Example implementation of `INavigationClient` which can be used to override the default navigation functions MSAL.js uses

### (Optional) MSAL React and class components

For a demonstration of how to use MSAL React with class components, see: `./src/pages/ProfileWithMsal.jsx` and `./src/pages/ProfileRawContext.jsx`.

*After* you initialize `MsalProvider`, there are 3 approaches you can take to protect your class components with MSAL React:

1. Wrap each component that you want to protect with `withMsal` higher-order component (HOC) (e.g. [Profile](./src/pages/ProfileWithMsal.jsx#Profile)).
1. Consume the raw context directly (e.g. [ProfileContent](./src/pages/ProfileRawContext.jsx#ProfileContent)).
1. Pass context down from a parent component that has access to the `msalContext` via one of the other means above (e.g. [ProfileContent](./src/pages/ProfileWithMsal.jsx#ProfileContent)).

For more information, visit:

- [Docs: Class Components](../../../lib/msal-react/docs/class-components.md)
- [MSAL React FAQ](../../../lib/msal-react/FAQ.md)

## How to run the sample

### Pre-requisites

- Ensure [all pre-requisites](../../../lib/msal-react/README.md#prerequisites) have been completed to run `@azure/msal-react`.
- Install node.js if needed (<https://nodejs.org/en/>).

### Configure the application

- Open `./src/authConfig.js` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration.
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

#### Install npm dependencies for sample

##### Installing @azure/msal-react and @azure/msal-browser from local builds

```bash
# Install dev dependencies for msal-react and msal-browser from root of repo
npm install

# Change directory to sample directory
cd samples/msal-react-samples/react-router-sample

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
cd samples/msal-react-samples/react-router-sample

# Install packages from npm
npm run install:published

# Install rest of dependencies
npm install
```

#### Running the sample development server

1. In a command prompt, run `npm start`.
1. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
1. Open [http://localhost:3000/profile](http://localhost:3000/profile) to see an example of a protected route. If you are not yet signed in, signin will be invoked automatically.

The page will reload if you make edits.
You will also see any lint errors in the console.

- In the web page, click on the "Login" button and select either `Sign in using Popup` or `Sign in using Redirect` to begin the auth flow.

#### Running the sample production server

1. In a command prompt, run `npm run build`.
1. Next run `serve -s build`
1. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
1. Open [http://localhost:3000/profile](http://localhost:3000/profile) to see an example of a protected route. If you are not yet signed in, signin will be invoked automatically.

#### Running the sample in IE11

`@azure/msal-react` and `@azure/msal-browser` support IE11 but the `react-scripts` package requires a few polyfills to work properly. In order to run this sample in IE11 go to `src/index.js` and uncomment the first 2 imports. We recommend using the redirect flow and setting the `storeAuthStateInCookie` config parameter to `true` in IE11 as there are known issues with popups. You can read more about the known issues with IE11 [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Known-issues-on-IE-and-Edge-Browser)

#### Learn more about the 3rd-party libraries used to create this sample

- [React documentation](https://reactjs.org/).
- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Router documentation](https://reactrouter.com/web/guides/quick-start)
- [Material-UI documentation](https://material-ui.com/getting-started/installation/)
