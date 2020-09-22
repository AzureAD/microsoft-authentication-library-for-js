# MSAL Node Vanilla JS Sample

## About this sample

This developer sample application is used to run a variety of use cases for the MSAL Node library. You can also customize the JSON configuration files in `./app/scenarios/<scenario-name>/` or create your own scenario configuration based on the scenario template (`./app/scenarios/scenario-template`) to execute other behaviors and scenarios.

**Note: This unified sample application is optimized for end-to-end test automation. We currently also offer [standalone versions](../standalone-samples) of `msal-node` usage samples which are tailored to each specific authorization flow that msal-node supports. We are working towards keeping a single set of usage samples, so it is likely that the standalone samples will be removed once this Vanilla JS multi-flow sample application is stable enough.**

## How to run the sample:

### Pre-requisites
- Ensure [all pre-requisites](../../../lib/msal-node/README.md#prerequisites) have been completed to run msal-node.
- Install Node.js if needed (https://nodejs.org/en/).
- Build the `msal-node` project with instructions provided in the [`README.md`](../../../lib/msal-node/README.md) or using the command `npm run build:package`.

### Configure the application
Open the `./app/scenarios/<scenario-name>/` directory corresponding to your scenario of choice in an editor. The JSON files contained in each directory hold the configuration options that are required to execute the sample application for that specific scenario. The following is a list of the files that can be contained in a scenario configuration directory and the configuration options they expose.

*Note: Different scenarios and authorization flows require different configuration options, which is why JSON configuration files will have different keys for each scenario.*


1. **authOptions.json**

    This file is used to configure the MSAL AuthOptions configuration object that mostly deals with the configuration of the AzureAD App Registration. Replace clientId with the ClientId value in your AzureAD App Regsitration (as well as the client secret if you are using a Confidential Client Application). You can update the rest of the values listed in the JSON object to match your Azure App registration configuration.

    Example `./app/scenarios/auth-code-aad/authOptions.json`:

    ```json
    {
        "clientId": "YOUR_CLIENT_ID",
        "authority": "YOUR_AUTHORITY_URL",
        "clientSecret": "YOUR_CONFIDENTIAL_CLIENT_APPLICATION_SECRET"
    }
    ```

2. **requestConfig.json**

    This JSON file includes configuration options that deal with specific authorization and authentication requests (i.e. token requests). Customize this file to configure request-specific scopes, redirect URIs, and other request configuration options.

    Example `./app/scenarios/auth-code-aad/requestConfig.json`:

    ```json
    {
        "authCodeUrlParameters": {
            "scopes": ["user.read"],
            "redirectUri": "YOUR_REDIRECT_URI"
        },
        "tokenRequest": {
            "redirectUri": "YOUR_REDIRECT_URI",
            "scopes": ["user.read"]
        }
    }
    ```

3. **resourceApiConfig.json**

    Scenarios for some authorization flows (such as the Silent Flow) make use of Resource APIs (such as the Microsoft Graph API) in order to demonstrate the use of access tokens in an authorization scenario. This file contains a single configuration option: `resourceApiEndpoint`. This is the endpoint the sample application will make a GET request to in the `./app/resourceApi.js` script.

    Example `./app/scenarios/auth-code-aad/requestConfig.json`:

    ```json
    {
        "resourceEndpoint": "https://graph.microsoft.com/v1.0/me"
    }
    ```

4. **scenarioConfig,json**

    This file is the only one not related to MSAL configuration. It is used in order to tell the sample application how to execute the scenario with its custom configuration:

    - `appType`: The options for `appType` are either `web` for scenarios that use flows that use an Express web app (i.e. Authorization Code and Silent) or `cli` for flows that can be run from the command line (i.e. Device Code and Refresh Token)

    - `flow`: This value represents the Authorization Flow supported by MSAL Node that a scenario is supposed to use. Each of the supported flows has it's own application code in the `./app/routes/` directory. The `flow` configuration option should match the name of one of the files under `./app/routes/`. Currently supported flows and their configuration values are summarized in the following table:

        | Authorization Flow | Configuration value |
        | ------------------ | ------------------- |
        | Authorization Code |     `authCode`      |
        | Silent Flow        |      `silent`       |
        | Device Code        |    `deviceCode`     |
        | Refesh Token       |   `refreshToken`    |
    
    - `clientType`: This value determines what subclass of `ClientApplication` the sample application instantiates for authorization requests. Possible values:
        
        |  ClientApplication Subclass   | Configuration value |
        | ----------------------------- | ------------------- |
        | PublicClientApplication       |      `public`       |
        | ConfidentialClientApplication |      `silent`       |

        *Note: When configuring a scenario to use a ConfidentialClientApplication, make sure to include the `clientSecret` value in the `authOptions.json` scenario configuration file.*

        Example `./app/scenarios/auth-code-aad/scenarioConfig.json`:

        ```json
        {
            "appType": "web",
            "flow": "authCode",
            "clientType": "confidential"
        }
        ```


#### Install npm dependencies for sample
- In a command prompt, run `npm install`.

#### Running the sample application
1. In a command prompt, run `npm start`. The default scenario is the `silent-flow-aad` scenario.
    - If you wish to specify a different sample than the default, you may provide the sample name in the command prompt:
    ```bash
    npm start -- -scenario <scenario-name> # defaults to scenario sample in `silent-flow-aad` directory
    ```

    ```bash
    npm start -- -s <scenario-name> # defaults to scenario sample in 'silent-flow-aad' directory
    ```

    - If you wish to specify the port for scenarios with the `web` appType, you can provide the `-p` or `-port` flag:
    ```bash
    npm start -- -port <port-#> # defaults to 3000
    ```

    ```bash
    npm start -- -p <port-#> # defaults to 30000
    ```

2. If you're executing a web application scenario, navigate to http://localhost:3000 (or whatever port number specified) with the browser of your choice.

3. For `cli` appType scenarios, follow the instructions on your command line interface to use the sample application.
