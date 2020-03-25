# MSAL.js 2.0 Sample - Authorization Code Flow in Single-Page Applications

## About this sample
This developer sample is used to run basic use cases for the MSAL library. You can also alter the configuration in `./JavascriptSPA/authConfig.js` to execute other behaviors.

## How to run the sample:

### Pre-requisites
- Ensure [all pre-requisites](../lib/msal-browser/README.md#pre-requisites) have been completed to run msal-browser.
- Install node.js if needed (https://nodejs.org/en/).
- Build the `msal-browser` project with instructions provided in the [`README.md`](../lib/msal-browser/README.md).

### Configure the application
- Open `./JavascriptSPA/authConfig.js` in an editor.
- Replace client id with the Application (client) ID from the portal registration. 

Resolving the server.js references
- In a command prompt, run `npm install`.

Running the sample
- In a command prompt, run `npm start`.

You may also run `npm run start:build` to build the `msal-core` project and start the server in one command.

- Navigate to http://localhost:30662 with the browser of your choice.

- In the web page, click on the "Sign In" button and select either `Sign in using Popup` or `Sign in using Redirect`.
