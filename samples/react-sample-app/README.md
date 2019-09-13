# MSAL React Sample Application

The directory contains a sample React single-page application for the `msal` library. This sample is provided to demonstrate how developers can use the `msal` library in a React application and recommended best practices for doing so.

This sample was built using [Create React App](https://github.com/facebook/create-react-app). More info for Create React App can be found [here](./CRA_README.md).

## Instructions

1. Build the [msal-core](../../) project (by running `npm install` and `npm run build:modules` in its directory).
2. Change directories back to this folder, and then run `npm install` and then `npm start`.
3. This will launch the sample application in your browser (if not, navigate to [http://localhost:3000](http://localhost:3000)).

## Patterns

### Higher-order components

This sample implements the [higher-order component pattern](https://reactjs.org/docs/higher-order-components.html) for the `AuthProvider` component class, where almost all of the authentication-related business logic lives.

This was chosen for a few reasons:

1. Provide a clean separation between the display logic of the application from the business logic needed to facilitate authentication via MSAL.
2. The `AuthProvider` class is a reusable abstraction that you can use anywhere in your app.
3. The `MsalApplication` is instatiated as a singleton, following best practices for the `msal` library.

### async/await

This samples uses [`async/await` syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) for most promise operations, as it provides simpler syntax for asynchronous operations as compared to normal promise chaining. As noted below, this may require your build tooling to providing support for this syntax (via Babel, Webpack, Typescript, etc). Otherwise, normal promise chaining can be used instead.

## Caveats

This sample is intended to demonstrate how to use the `msal-core` library with React. Note, that these samples only demonstrate certain scenarios, and may not work with your use case. Below are some noteable caveats to these samples:

1. Currently only works with client-side rendering.
2. The samples are built using Create React App, which ships with polyfills for the `Promise` and `Fetch` APIs for Internet Explorer support. Be sure to include these polyfills (or equivalent) when copying these samples. For Create React App, be sure to also include `"ie 11"` in the `browserslist` objects in `package.json`. You don't need to include this code if you don't intend to support IE11 (or other older browsers).
3. The samples show support for both popup and redirect flows (for IE or other older browsers). You don't need to include code for both if you don't need support for both flows.
