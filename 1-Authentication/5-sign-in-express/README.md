---
page_type: sample
name: Sign in users in a sample Node.js & Express web app by using Microsoft Entra External ID for customers
description: This sample demonstrates a Node.js & Express web app authenticating users by using Microsoft Entra External ID for customers with Microsoft Authentication Library for Node (MSAL Node)
languages:
 - javascript
products:
 - entra-external-id
 - msal-node
urlFragment: ms-identity-ciam-javascript-tutorial-5-sign-in-express
extensions:
    services: 
    - active-directory
    sub-service:
    - ciam
    platform: 
    - JavaScript
    endpoint: 
    - AAD v2.0
    level: 
    - 100
    client: 
    - Node.js & Express web app
---

# Sign in users in a sample Node.js (Express.js) web app by using Microsoft Entra External ID for customers

* [Overview](#overview)
* [Usage](#usage)
* [Scenario](#scenario)
* [Contents](#contents)
* [Prerequisites](#prerequisites)
* [Setup the sample](#setup-the-sample)
* [Explore the sample](#explore-the-sample)
* [Troubleshooting](#troubleshooting)
* [About the code](#about-the-code)
* [Contributing](#contributing)
* [Learn More](#learn-more)

## Overview

This sample demonstrates how to sign users into a sample Node.js & Express web app by using Microsoft Entra External ID for customers. The samples utilizes the [Microsoft Authentication Library for Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) (MSAL Node) to simplify adding authentication to the Node.js web app.

## Usage

|          Instruction  |                Description                 |
|-----------------------|--------------------------------------------|
| **Use case**          | This code sample applies to **customer configuration uses case**![Yes button](./ReadmeFiles/yes.png "Title"). If you're looking for a workforce configuration use case, use [Tutorial: Enable a Node.js (Express) application to sign in users by using Microsoft Entra ID](https://github.com/Azure-Samples/ms-identity-node)      |
| **Scenario**        | Sign in users. You acquire an ID token by using authorization code flow with PKCE. |
|    **Add sign in to your app**        | Use the instructions in [Sign in users in a Node.js web app](https://learn.microsoft.com/entra/external-id/customers/tutorial-web-app-node-sign-in-prepare-tenant) to learn how to add sign in to your Node web app. |
|**Product documentation** | Explore [Microsoft Entra ID for customers documentation](https://learn.microsoft.com/entra/external-id/customers/) |

## Contents

| File/folder           | Description                                |
|-----------------------|--------------------------------------------|
| `App/app.js`          | Application entry point.                   |
| `App/authConfig.js`   | Contains authentication parameters such as your tenant sub-domain, Application (Client) ID, app client secret and redirect URI.        |
| `App/auth/AuthProvider.js`  | The main authentication logic resides here.    |
|    `/App/views/`    |    This folder contains app views. This Node/Express sample app's views uses Handlebars. |
|    `/App/routes/`    |    This folder contains app's routes. |

## Prerequisites

* You must install [Node.js](https://nodejs.org/en/download/) in your computer to run this sample.
* We recommend [Visual Studio Code](https://code.visualstudio.com/download) for running and editing this sample.
* Microsoft Entra ID for customers tenant. If you don't already have one, [sign up for a free trial](https://aka.ms/ciam-free-trial).
* If you'd like to use Azure services, such as hosting your app in Azure App Service, [VS Code Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-node-azure-pack) extension is recommended for interacting with Azure through VS Code Interface.

## Register the web application in your tenant

You can register an app in your tenant automatically by using Microsoft Graph PowerShell or via the Microsoft Entra Admin center.

When you use Microsoft Graph PowerShell, you automatically register the applications and related objects app secrets, then modify your project config files, so you can run the app without any further action:


* To register your app in the Microsoft Entra admin center use the steps in [Register the web app](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#register-the-web-app).

* To register and configure your app automatically, 

    <details>
        <summary>Expand this section</summary>
    
    > :warning: If you have never used **Microsoft Graph PowerShell** before, we recommend you go through the [App Creation Scripts Guide](./AppCreationScripts/AppCreationScripts.md) once to ensure that you've prepared your environment correctly for this step.
    
    1. Ensure that you have PowerShell 7 or later installed.
    1. Run the script to create your Microsoft Entra ID application and configure the code of the sample application accordingly.
    1. For interactive process in PowerShell, run:
    
        ```PowerShell
        cd .\AppCreationScripts\
        .\Configure.ps1 -TenantId "[Optional] - your tenant id" -AzureEnvironmentName "[Optional] - Azure environment, defaults to 'Global'"
        ```
    
    > Other ways of running the scripts are described in [App Creation Scripts guide](./AppCreationScripts/AppCreationScripts.md). The scripts also provides a guide to automated application registration, configuration and removal which can help in your CI/CD scenarios.
    
    > :exclamation: NOTE: This sample can make use of client certificates. You can use **AppCreationScripts** to register an Microsoft Entra ID application with certificates. For more information see, [Use client certificate for authentication in your Node.js web app instead of client secrets](https://review.learn.microsoft.com/entra/external-id/customers/how-to-web-app-node-use-certificate).
    
    </details>

## Add app client secret

To create a client secret for the registered application, use the steps in [Add app client secret](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#add-app-client-secret)

## Grant API permissions

To grant delegated permissions, use the steps in [Grant API permissions](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#grant-api-permissions).

## Create user flow

To create a user flow a customer can use to sign in or sign up for an application, use the steps in [Create a user flow](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#create-a-user-flow) 

## Associate the web application with the user flow

To associate the web application with the user flow, use the steps in [Associate the web application with the user flow](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#associate-the-web-application-with-the-user-flow).

## Clone or download sample web application

To get the web app sample code, use the steps in [Clone or download sample web application](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#clone-or-download-sample-web-application).

## Install project dependencies

To install app dependencies, use the steps in [Install project dependencies](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#install-project-dependencies).

## Configure the sample web app to use your app registration

Once you download the sample app, you need to update it so that it uses the settings of the web app that you registered. To do so, use the steps in [Configure the sample web app](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#configure-the-sample-web-app).

## Run and test sample web app

You can now test the sample Node.js web app. You need to start the Node.js server and access it through your browser at `http://localhost:3000`. To do so, use the steps in [Run and test sample web app](https://learn.microsoft.com/entra/external-id/customers/sample-web-app-node-sign-in#run-and-test-sample-web-app).

> :information_source: If the sample didn't work for you as expected, reach out to us using the [GitHub Issues](../../../../issues) page.

## We'd love your feedback

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_ivMYEeUKlEq8CxnMPgdNZUNDlUTTk2NVNYQkZSSjdaTk5KT1o4V1VVNS4u).

## Troubleshooting

<details>
	<summary>Expand for troubleshooting info</summary>

> * Use [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) to get support from the community. Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before. Make sure that your questions or comments are tagged with [`azure-active-directory-b2c` `node` `ms-identity` `adal` `msal-js` `msal`].

To provide feedback on or suggest features for Microsoft Entra ID or Microsoft Entra External ID, visit [User Voice page](https://feedback.azure.com/d365community/forum/79b1327d-d925-ec11-b6e6-000d3a4f06a4).
</details>

## About the code

### Initialization

In order to use MSAL Node, we instantiate the [ConfidentialClientApplication](https://learn.microsoft.com/javascript/api/@azure/msal-node/confidentialclientapplication?view=azure-node-latest):

1. Create the configuration object, `msalConfig`,  as shown in the *App/authConfig.js* file:

    ```javascript
    const msalConfig = {
        auth: {
            clientId: process.env.CLIENT_ID || 'Enter_the_Application_Id_Here', // 'Application (client) ID' of app registration in Microsoft Entra - this value is a GUID
            authority: process.env.AUTHORITY || `https://${TENANT_SUBDOMAIN}.ciamlogin.com/`, // Replace the placeholder with your tenant name
            clientSecret: process.env.CLIENT_SECRET || 'Enter_the_Client_Secret_Here', // Client secret generated from the app registration in Azure portal
        },
        ...
        ...
    };
    ```

1. Use the `msalConfig` object to instantiate the confidential client application shown in the *App/auth/AuthProvider.js file (`AuthProvider` class):  

    ```javascript
    ...
    ...
    getMsalInstance(msalConfig) {
        return new msal.ConfidentialClientApplication(msalConfig);
    }
    ....
    ...
    ```

### Sign in

The first leg of auth code flow generates an authorization code request URL, then redirects to that URL to obtain the authorization code. This first leg is implemented in the `redirectToAuthCodeUrl` method. Notice how we use MSALs [getAuthCodeUrl](https://learn.microsoft.com/javascript/api/%40azure/msal-node/confidentialclientapplication?view=azure-node-latest#@azure-msal-node-confidentialclientapplication-getauthcodeurl) method to generate authorization code URL, then redirect to the authorization code URL itself:

```javascript
    async redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams, msalInstance) {
        ...
        ...

        try {
            const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
            res.redirect(authCodeUrlResponse);
        } catch (error) {
            next(error);
        }
    }
```

In the second leg of auth code flow uses, use the authorization code to request an ID token by using MSAL's [acquireTokenByCode]() method. You can store the ID token and user account information in an express session.

```javascript
    async handleRedirect(req, res, next) {
        const authCodeRequest = {
            ...req.session.authCodeRequest,
            code: req.body.code, // authZ code
            ...
        };

        try {
            const msalInstance = this.getMsalInstance(this.config.msalConfig);
            msalInstance.getTokenCache().deserialize(req.session.tokenCache);

            const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, req.body);

            req.session.tokenCache = msalInstance.getTokenCache().serialize();
            req.session.idToken = tokenResponse.idToken;
            req.session.account = tokenResponse.account;
            req.session.isAuthenticated = true;
            ...
            ...
        } catch (error) {
            next(error);
        }
    }
```

### Sign out

When you want to sign the user out of the application, it isn't enough to end the user's session. You must redirect the user to the `logoutUri`. Otherwise, the user might be able to reauthenticate to your applications without reentering their credentials. If the name of your tenant is contoso, then the logoutUri looks similar to `https://contoso.ciamlogin.com/contoso.onmicrosoft.com/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:3000`.

```javascript
    async logout(req, res, next) {
        /**
         * Construct a logout URI and redirect the user to end the session with Microsoft Entra ID. 
        */
        const logoutUri = `${this.config.msalConfig.auth.authority}${TENANT_SUBDOMAIN}.onmicrosoft.com/oauth2/v2.0/logout?post_logout_redirect_uri=${this.config.postLogoutRedirectUri}`;
    
        req.session.destroy(() => {
            res.redirect(logoutUri);
        });
    }
```

### Deploying Web app to Azure App Service

There is one web app in this sample. To deploy it to **Azure App Services**, you'll need to:

*Create an **Azure App Service**
*Publish the projects to the **App Services**, and
*Update its client(s) to call the website instead of the local environment.

#### Deploy your files of your web app

1. In the **VS Code** activity bar, select the **Azure** logo to show the **Azure App Service** explorer.
1. Select **Sign in to Azure...**, then follow the instructions. Once signed in, the explorer should show the name of your **Azure** subscription(s).
1. On the **App Service** explorer section you see an upward-facing arrow icon. Select it publish your local files in the project folder to **Azure App Services** (use "Browse" option if needed, and locate the right folder).
1. Choose a creation option based on the operating system to which you want to deploy. In this sample, we illustrate by using the **Linux** option.
1. Select a **Node.js** version when prompted. We recommend a **LTS** version.
1. Type a globally unique name for your web app and select **Enter**. The name must be unique across all of **Azure** services. After you respond to all the prompts, **VS Code** shows the **Azure** resources that are being created for your app in its notification popup.
1. Select **Yes** when prompted to update your configuration. This action runs `npm install` on the target **Linux** server.

#### Update app registration to use deployed app

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) as at least an [Application Developer](https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference#application-developer).
1. Browse to **Identity** >**Applications** > **App registrations**.
1. From the app registration list, select the app that you want to update.
1. Under **Manage**, select **Authentication**.
1. Update your **Redirect URIs** to to match the site URL of your Azure deployment such as `https://ciam-msal-node-webapp.azurewebsites.net/auth/redirect`.
1. Select **Configure** to save your changes.

> :warning: If your app use *in-memory* storage, **Azure App Services** will spin down your web site if it is inactive. This action empties any records in the memory. In addition, if you increase the instance count of your website, Azure Service distributes the requests among the instances. Therefore, your app's records won't be the same on each instance.
</details>

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Learn More

* [Customize the default branding](https://learn.microsoft.com/entra/external-id/customers/how-to-customize-branding-customers)
* [Language customize](https://learn.microsoft.com/entra/external-id/customers/how-to-customize-languages-customers)
* [Building Zero Trust ready apps](https://aka.ms/ztdevsession)
* [Initialize client applications using MSAL.js](https://learn.microsoft.com/entra/identity-platform/msal-js-initializing-client-applications)
* [Single sign-on with MSAL.js](https://learn.microsoft.com/entra/identity-platform/msal-js-sso)
* [Handle MSAL.js exceptions and errors](https://learn.microsoft.com/entra/msal/dotnet/advanced/exceptions/msal-error-handling?tabs=javascript)
* [Logging in MSAL.js applications](https://learn.microsoft.com/entra/msal/dotnet/advanced/exceptions/msal-logging?tabs=javascript)
* [Pass custom state in authentication requests using MSAL.js](https://learn.microsoft.com/entra/identity-platform/msal-js-pass-custom-state-authentication-request).