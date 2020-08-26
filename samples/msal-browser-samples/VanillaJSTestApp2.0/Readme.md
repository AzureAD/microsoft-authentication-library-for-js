# MSAL.js 2.x Sample - Authorization Code Flow in Single-Page Applications

## About this sample
This developer sample is used to run basic use cases for the MSAL library. You can also alter the configuration in `./app/<sample-name>/authConfig.js` to execute other behaviors.

## How to run the sample:

### Pre-requisites
- Ensure [all pre-requisites](../../../lib/msal-browser/README.md#prerequisites) have been completed to run msal-browser.
- Install node.js if needed (https://nodejs.org/en/).
- Build the `msal-browser` project with instructions provided in the [`README.md`](../../../lib/msal-browser/README.md) or using the command `npm run build:package`.

### Configure the application
- Open `./app/<sample-name>/authConfig.js` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration.
    - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

#### Install npm dependencies for sample
- In a command prompt, run `npm install`.

#### Running the sample
1. In a command prompt, run `npm start`.
    - If you wish to specify a different sample than the default, you may provide the sample name in the command prompt:
    ```javascript
    npm start -- -sample <sample-name> // defaults to vanilla sample in `default` folder
    ```

    ```javascript
    npm start -- -s <sample-name> // defaults to vanilla sample in 'default' folder
    ```

    - If you wish to specify the port, you can provide the `-p` or `-port` flag:
    ```javascript
    npm start -- -port <port-#> // defaults to 30662
    ```

    ```javascript
    npm start -- -p <port-#> // defaults to 30662
    ```

- Navigate to http://localhost:30662 (or whatever port number specified) with the browser of your choice.

- In the web page, click on the "Sign In" button and select either `Sign in using Popup` or `Sign in using Redirect` to begin the auth flow.
