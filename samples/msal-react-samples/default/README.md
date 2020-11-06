# MSAL.js for React Sample - Authorization Code Flow in Single-Page Applications

## About this sample

This developer sample is used to run basic use cases for the MSAL library. You can also alter the configuration in `./src/authConfig.js` to execute other behaviors.
This sample was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## How to run the sample

### Pre-requisites

- Ensure [all pre-requisites](../../../lib/msal-react/README.md#prerequisites) have been completed to run msal-react.
- Install node.js if needed (https://nodejs.org/en/).
- Build the `msal-react` project with instructions provided in the [`README.md`](../../../lib/msal-react/README.md) or using the command `npm run build:package`.

### Configure the application

- Open `./src/authConfig.js` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration.
    - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

#### Install npm dependencies for sample

- In a command prompt, run `npm install`.

#### Running the sample

1. In a command prompt, run `npm start`.
1. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

- In the web page, click on the "Sign In" button and select either `Sign in using Popup` or `Sign in using Redirect` to begin the auth flow.

#### Learn More about Create React App

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
