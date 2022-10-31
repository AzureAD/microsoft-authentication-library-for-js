# MSAL.js 2.x + Vue 3 + TypeScript Sample

## About this sample

This sample demonstrates one way you can integrate the `@azure/msal-browser` package into your Vue 3 application using the [composition API](https://v3.vuejs.org/api/composition-api.html). It is not exhaustive and there may be simpler or more complex solutions depending on your specific use case.

⚠️ This sample is currently for demonstration purposes only. Support will be limited.

## How to run the sample

### Pre-requisites

- Ensure [all pre-requisites](../../../lib/msal-browser/README.md#prerequisites) have been completed to run `@azure/msal-browser`.
- Install node.js if needed (<https://nodejs.org/en/>).

### Configure the application

- Open `./src/authConfig.js` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration.
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

### Install npm dependencies for sample

```bash
npm install
```

### Running the sample

```bash
npm start
```

1. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

- In the web page, hover over the "Sign In" button and select either `Sign in using Popup` or `Sign in using Redirect` to begin the auth flow.
- Navigate directly to one of the example pages (/profile or /profilenoguard) to invoke a login on page load and see your profile information using the Microsoft Graph API

## How this sample works

This sample demonstrates how you can integrate `@azure/msal-browser` into your Vue application. It is best if you familiarize yourself with the `@azure/msal-browser` package first, as this sample will build on many of the concepts defined there. You'll find the `msal-browser` package [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser) and you'll find a variety of docs you may find useful [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser/docs). The following sections will walk you through each part of this sample and explain a little bit about how it works.

### Configuration

You'll find the MSAL configuration and `PublicClientApplication` instantiation in `authConfig.ts`. It's very important that `PublicClientApplication` is initialized only once per pageload and as such should not be initialized inside any Vue components, but rather outside the context of Vue and passed in.

- The `clientId` is the most important, and only required parameter, as it maps to your app registration in the Azure Portal.
- The `authority` represents the Azure AD instance and tenant that MSAL.js will use the sign users in. This parameter controls the audience of your app.
    > :information_source: If you need to sign users in with Azure AD B2C, this parameter should be set to the [B2C tenanted authority](../../../lib/msal-common/docs/authority.md#azure-ad-b2c) with the default user-flow/custom policy that will be used for sign-ins and token acquisitions. To learn more about how to handle B2C user-flows and/or custom policies with MSAL.js, please refer to [react-b2c-sample](../../msal-react-samples/b2c-sample/) and/or [angular-b2c-sample](../../msal-angular-v2-samples/angular-b2c-sample-app/).
- The `redirectUri` and `postLogoutRedirectUri` represent where AAD will redirect you back to after logging in and must be registered on your app registration as type "SPA". If you do not provide these, MSAL.js will use the current page by default.

The `cacheLocation` configures where you want your tokens to be stored. SessionStorage is the default, if this option is not provided.

```javascript
const msalConfig = {
  auth: {
    clientId: 'ENTER_YOUR_CLIENT_ID_HERE',
    authority: 'https://login.microsoftonline.com/ENTER_YOUR_TENANT_ID_HERE',
    redirectUri: '/', // Must be registered as a SPA redirectURI on your app registration
    postLogoutRedirectUri: '/' // Must be registered as a SPA redirectURI on your app registrationregistration
  },
  cache: {
    cacheLocation: 'localStorage' // Options are localStorage, sessionStorage, memoryStorage
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

You can read more about configuring MSAL.js and the complete set of options [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md)

### MsalPlugin

MSAL.js integration with Vue all starts with the `msalPlugin` defined in `src/plugins/msalPlugin.ts`. When installed in your Vue app this plugin registers an event listener that manages some global state, such as any interaction currently in progress and the accounts signed in.

In `main.ts` you'll find the instantiation of the Vue app and installation of plugins. The most important part, with regards to MSAL.js, is to instruct Vue to "use" the `msalPlugin`.

```javascript
import { createApp } from 'vue';
import App from './App.vue'; // Your root component
import { msalPlugin } from "./plugins/msalPlugin";
import { msalInstance } from "./authConfig";

const app = createApp(App);
app.use(msalPlugin, msalInstance);
app.mount('#app');
```

### Composition APIs

This sample demonstrates how you can write a couple different composition APIs which can be called from the `setup` function of any of your Vue components that need to do something authentication related.

#### useMsal

This API will call `handleRedirectPromise` if it has not yet been called. This is very important if your application uses redirects instead of popups because this is what actually processes the response from your Identity Provider. It should be called at least once per page load before you do anything else related to authentication. If you are using popups as your interaction type, this is not needed.

This API also returns:

- The `PublicClientApplication` instance which you can use to call any of the [MSAL APIs](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_browser.ipublicclientapplication.html)
- A `ref` indicating what type of interaction is currently in progress.
- A `ref` of the array of accounts currently signed in

Basic examples of how this can be used can be found in each of the vue components located in `src/components`

#### useIsAuthenticated

Returns a `ref` indicating if a user is signed-in or not. The implementation in this sample says that a user is signed in if at least 1 account is present in the account array. More complex use cases may require a different implementation.

One example of how this could be used can be found in `src/components/NavBar.vue`. It is used as the condition for the `v-if` directive to conditionally render a Sign In or Sign Out button depending on the sign-in state of the user. This is reactive and will update as soon as the user signs in or out.

```vue
<template>
    <SignOutButton v-if="isAuthenticated"/>
    <SignInButton v-else />
</template>

<script setup lang="ts">
import { useIsAuthenticated } from '../composition-api/useIsAuthenticated';
import SignInButton from "./SignInButton.vue";
import SignOutButton from "./SignOutButton.vue";

const isAuthenticated = useIsAuthenticated();
</script>
```

#### useMsalAuthentication

Will attempt to silently acquire a token and fallback to interaction if no user is signed in or silent acquisition fails. This can be used instead of a route guard to protect components.

You must provide:

- Your preferred interaction type (Popup or Redirect) to be used in case the request cannot be completed silently
- The auth request that will be used to acquire the token. You can find the request/response types [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md)

Returns:

- A `ref` of the `AuthenticationResult` object containing the accessToken and idToken, among other things. The full response object can be found [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult)
- An `acquireToken` function that can be called from your Vue component when a new token is needed or to recover from an error. The other return values will be updated when this function is invoked.
- A `ref` of the error object if the token request failed for any reason
- An `ref` indicating if this instance of `useMsalAuthentication` is currently acquiring a token. (Note this is different from the inProgress value returned by `useMsal` which represents only interaction and is global)

Usage of this is demonstrated on the `/profilenoguard` route located in `src/views/ProfileNoGuard.vue`. A generic example can be seen below:

```vue
<template>
  <span>{{data}}</span>
</template>

<script setup lang="ts">
import { useMsalAuthentication } from "../composition-api/useMsalAuthentication";
import { InteractionType } from "@azure/msal-browser";
import { reactive, watch } from 'vue'
import { loginRequest } from "../authConfig";

const { result, acquireToken } = useMsalAuthentication(InteractionType.Redirect, loginRequest);

const data = ref(null);

async function updateData() {
    if (result.value.accessToken) {
        const apiResult = await callAPI(result.value.accessToken).catch(() => acquireToken());
        data.value = apiResult;
    }
}

updateData();

watch(result, () => {
    // Fetch new data from the API each time the result changes (i.e. a new access token was acquired)
    updateData();
});
</script>
```

### Integrating with vue-router

This sample demonstrates integration with the official router for vue: `vue-router`. The concepts here may also be relevant to other 3rd party routers, but the implementations may differ.

#### Configuring MSAL to use the router for route changes

When MSAL.js needs to change routes, such as when returning the user to the page they were trying to get to from the `redirectUri`, it will by default reassign `window.location`. This can be a problem when using routers because it will trigger a full page refresh, rerendering the entire page, which is not always desired. To take advantage of the benefits routers provide MSAL.js exposes an API called `setNavigationClient` which allows you to override the methods used to perform navigation.

An example navigation client for `vue-router` can be found in `src/router/NavigationClient.ts`. You'll also find the following 2 lines in `main.ts` which provides this custom navigation client to MSAL.js:

```javascript
const navigationClient = new CustomNavigationClient(router);
msalInstance.setNavigationClient(navigationClient);
```

#### Guarding routes

This sample also demonstrates how to write a global route guard if your application uses the `vue-router` package to handle routing.

In the router configuration, located in `src/router/router.ts`, we register the route we want to protect with a `meta.requiresAuth` property, like so:

```javascript
const routes = [
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
        requiresAuth: true
    }
  }
];
```

Then we register a global route guard, as shown in `src/router/Guard.ts`. A similar approach can be taken for [per route guards](https://router.vuejs.org/guide/advanced/navigation-guards.html#per-route-guard) instead, if desired.
