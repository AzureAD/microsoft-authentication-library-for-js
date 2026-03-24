# MSAL.js for React Sample - React 16 Compatibility

## About this sample

This sample is derived from the [react-router-sample](../react-router-sample) and demonstrates MSAL React running with **React 16** (16.8+). It uses `ReactDOM.render` (React 16 API) for rendering and MUI v4 (`@material-ui/core`) for UI components, since MUI v5 (`@mui/material`) does not support React 16.

## Notable files and what they demonstrate

1. `./src/App.jsx` - Shows implementation of `MsalProvider`, all children will have access to `@azure/msal-react` context, hooks and components.
1. `./src/index.jsx` - Shows intialization of the `PublicClientApplication` that is passed to `App.jsx`
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

- Open `./env.development` in an editor.
- Replace `ENTER_CLIENT_ID_HERE` with the Application (client) ID from the portal registration, or use the currently configured lab registration.
- Replace `ENTER_TENANT_ID_HERE` with the tenant ID from the portal registration, or use the currently configured lab registration.
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

These parameters are used in `./src/authConfig.js` to configure MSAL.

#### Install npm dependencies for sample

```bash
# Install dev dependencies for msal-react and msal-browser from root of repo
npm install

# Change directory to sample directory
cd samples/msal-react-samples/react16-sample

# Build packages locally
npm run build:package
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
1. Next run `npx vite preview --port 3000 --strictPort`.
1. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
1. Open [http://localhost:3000/profile](http://localhost:3000/profile) to see an example of a protected route. If you are not yet signed in, signin will be invoked automatically.

#### Learn more about the 3rd-party libraries used to create this sample

- [React documentation](https://reactjs.org/).
- [Vite documentation](https://vite.dev/guide/)
- [React Router documentation](https://reactrouter.com/web/guides/quick-start)
- [Material-UI documentation](https://material-ui.com/getting-started/installation/)
