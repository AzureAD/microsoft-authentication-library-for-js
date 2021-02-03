# React single-page application built with MSAL React and Microsoft identity platform

This sample demonstrates how to use [MSAL React](https://www.npmjs.com/package/@azure/msal-react) to login, logout, conditionally render components to authenticated users, and acquire an access token for a protected resource such as Microsoft Graph.

This sample demonstrates usage of MSAL React with **class-based** React components.

## Setup

1. [Register a new application](https://docs.microsoft.com/azure/active-directory/develop/scenario-spa-app-registration) in the [Azure Portal](https://portal.azure.com). Ensure that the application is enabled for the [authorization code flow with PKCE](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow). This will require that you redirect URI configured in the portal is of type `SPA`.
1. Open the [/src/authConfig.js](./src/authConfig.js) file and provide the required configuration values.
1. On the command line, navigate to the root of the repository, and run `npm install` to install the project dependencies via npm.

## Running the sample

1. Configure authentication and authorization parameters:
   1. Open `src/authConfig.js`
   2. Replace the string `"Enter_the_Application_Id_Here"` with your app/client ID on AAD Portal.
   3. Replace the string `"Enter_the_Cloud_Instance_Id_HereEnter_the_Tenant_Info_Here"` with `"https://login.microsoftonline.com/common/"` (*note*: This is for multi-tenant applications located on the global Azure cloud. For more information, see the [documentation](https://docs.microsoft.com/azure/active-directory/develop/quickstart-v2-javascript-auth-code)).
2. To start the sample application, run `npm start`.
3. Finally, open a browser and navigate to [http://localhost:3000](http://localhost:3000).

## MSAL React and class components

> :information_source: For comparison, see the [MSAL React quickstart sample](https://github.com/Azure-Samples/ms-identity-javascript-react-spa) which uses functional components with hooks. The current sample you are viewing is a class based implementation of that sample.

*After* you initialize `MsalProvider`, there are 3 approaches you can take to protect your class components with MSAL React:

1. Wrap each component that you want to protect with `withMsal` higher-order component (HOC) (see [PageLayout](./src/ui.jsx#PageLayout))
1. Pass down the `msalContext` as prop to a child component from a parent component that is wrapped with `withMsal` HOC. (see [SignInSignOutButton](./src/ui.jsx#SignInSignOutButton))
1. Consume the raw context directly (see [ProfileContent](./src/App.jsx#ProfileContent)).

## More information

- [Docs: Class Components](../../lib/msal-react/docs/class-components.md)
- [MSAL React FAQ](../../lib/msal-react/FAQ.md)