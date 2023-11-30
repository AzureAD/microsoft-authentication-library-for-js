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

# Sign in users in a sample Node.js & Express web app by using Microsoft Entra External ID for customers

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
|**Product documentation** | Explore [Microsoft Entra ID for customers documentation](https://review.learn.microsoft.com/entra/external-id/customers/) |

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

## Register web application in your tenant

To enable your application to sign in users with Microsoft Entra, Microsoft Entra ID for customers must be made aware of the application you create. The app registration establishes a trust relationship between the app and Microsoft Entra. When you register an application, External ID generates a unique identifier known as an **Application (client) ID**, a value used to identify your app when creating authentication requests.

You can register an app in your tenant automatically by using Microsoft Graph PowerShell or Manually register your apps in Microsoft Entra Admin center.

When you use Microsoft Graph PowerShell, you automatically register the applications and related objects app secrets, then modifies your project config files, so you run the app without any further action.

<details>
    <summary>Expand this section if you want to use this automation:</summary>

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

To manually register your apps in Microsoft Entra Admin center, follow these steps:

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) as at least an [Application Developer](https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference#application-developer).
1. If you have access to multiple tenants, use the **Settings** icon (![settings icon](./ReadmeFiles/admin-center-settings-icon.png "Title")) in the top menu to switch to your customer tenant from the **Directories + subscriptions** menu.
1. Browse to **Identity** >**Applications** > **App registrations**.
1. Select **+ New registration**.
1. In the **Register an application** page that appears;

    1. Enter a meaningful application **Name** that is displayed to users of the app, for example *ciam-client-app*.
    1. Under **Supported account types**, select **Accounts in this organizational directory only**.

1. Select **Register**.
1. The application's **Overview** pane displays upon successful registration. Record the **Application (client) ID** to be used in your application source code.

To specify your app type to your app registration, follow these steps:

1. Under **Manage**, select **Authentication**.
1. On the **Platform configurations** page, select **Add a platform**, and then select **Web** option.
1. For the **Redirect URIs** enter `http://localhost:3000/auth/redirect`.
1. Select **Configure** to save your changes.

## Add app client secret

Create a client secret for the registered application. The application uses the client secret to prove its identity when it requests for tokens:

1. From the **App registrations** page, select the application that you created (such as *ciam-client-app*) to open its **Overview** page.
1. Under **Manage**, select **Certificates & secrets**.
1. Select **New client secret**.
1. In the **Description** box, enter a description for the client secret (for example, *ciam app client secret*).
1. Under **Expires**, select a duration for which the secret is valid (per your organizations security rules), and then select **Add**.
1. Record the secret's **Value**. You'll use this value for configuration in a later step.

> :information_source: The secret value won't be displayed again, and is not retrievable by any means, after you navigate away from the **Certificates and secrets** page, so make sure you record it. For enhanced security, [Use client certificate for authentication in your Node.js web app instead of client secrets](https://learn.microsoft.com/entra/external-id/customers/how-to-web-app-node-use-certificate).

## Grant API permissions

1. From the **App registrations** page, select the application that you created (such as *ciam-client-app*) to open its **Overview** page.
1. Under **Manage**, select **API permissions**.
1. Under **Configured permissions**, select **Add a permission**.
1. Select **Microsoft APIs** tab.
1. Under **Commonly used Microsoft APIs** section, select **Microsoft Graph**.
1. Select **Delegated permissions** option.
1. Under **Select permissions** section, search for and select both **openid** and **offline_access** permissions.
1. Select the **Add permissions** button. 
1. At this point, you've assigned the permissions correctly. However, since the tenant is a customer's tenant, the consumer users themselves can't consent to these permissions. You as the admin must consent to these permissions on behalf of all the users in the tenant:

    1. Select **Grant admin consent for \<your tenant name\>**, then select **Yes**.
    1. Select **Refresh**, then verify that **Granted for \<your tenant name\>** appears under **Status** for both scopes.

## Create user flow

Follow these steps to create a user flow a customer can use to sign in or sign up for an application.

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) as at least an [External ID User Flow Administrator](https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference#external-id-user-flow-administrator).  
1. If you have access to multiple tenants, use the **Settings** icon (![settings icon](./ReadmeFiles/admin-center-settings-icon.png "Title")) in the top menu to switch to your customer tenant from the **Directories + subscriptions** menu.
1. Browse to **Identity** > **External Identities** > **User flows**.
1. Select **+ New user flow**.
1. On the **Create** page:

   1. Enter a **Name** for the user flow, such as *SignInSignUpSample*.
   1. In the **Identity providers** list, select **Email Accounts**. This identity provider allows users to sign-in or sign-up using their email address.
   
         > :exclamation: NOTE: Additional identity providers will be listed here only after you set up federation with them. For example, if you set up federation with [Google](https://learn.microsoft.com/entra/external-id/customers/how-to-google-federation-customers) or [Facebook](https://learn.microsoft.com/entra/external-id/customers/how-to-facebook-federation-customers), you'll be able to select those additional identity providers here.  

   1. Under **Email accounts**, you can select one of the two options. For this tutorial, select **Email with password**.

      - **Email with password**: Allows new users to sign up and sign in using an email address as the sign-in name and a password as their first factor credential.  
      - **Email one-time-passcode**: Allows new users to sign up and sign in using an email address as the sign-in name and email one-time passcode as their first factor credential.

         > :exclamation: NOTE: Email one-time passcode must be enabled at the tenant level (**All Identity Providers** > **Email One-time-passcode**) for this option to be available at the user flow level.

   1. Under **User attributes**, choose the attributes you want to collect from the user upon sign-up. By selecting **Show more**, you can choose attributes and claims for **Country/Region**, **Display Name**, and **Postal Code**. Select **OK**. (Users are only prompted for attributes when they sign up for the first time.)

1. Select **Create**. The new user flow appears in the **User flows** list. If necessary, refresh the page.

To enable self-service password reset, use the steps in [Enable self-service password reset](https://learn.microsoft.com/entra/external-id/customers/how-to-enable-password-reset-customers) article.

## Associate the web application with the user flow

Although many applications can be associated with your user flow, a single application can only be associated with one user flow. A user flow allows configuration of the user experience for specific applications. For example, you can configure a user flow that requires users to sign-in or sign-up with a phone number or email address.

1. On the sidebar menu, select **Identity**.
1. Select **External Identities**, then **User flows**.
1. In the **User flows** page, select the **User flow name** you created earlier, for example, *SignInSignUpSample*.
1. Under **Use**, select **Applications**.
1. Select **Add application**.
   <!--[Screenshot the shows how to associate an application to a user flow.](media/20-create-user-flow-add-application.png)-->
1. Select the application from the list such as *ciam-client-app* or use the search box to find the application, and then select it.

1. Choose **Select**.

## Clone or download sample web application

To get the web app sample code, [Download the .zip file](https://github.com/Azure-Samples/ms-identity-ciam-javascript-tutorial/archive/refs/heads/main.zip) or clone the sample web application from GitHub by running the following command:

```console
git clone https://github.com/Azure-Samples/ms-identity-ciam-javascript-tutorial.git
```

If you choose to download the *.zip* file, extract the sample app file to a folder where the total length of the path is 260 or fewer characters.

## Install project dependencies

1. Open a console window, and change to the directory that contains the Node.js sample app:

```console
    cd 1-Authentication\5-sign-in-express\App
```

1. Run the following commands to install app dependencies:

```console
    npm install
```

## Configure the sample web app to use your app registration

1. In your code editor, open *App\authConfig.js* file.

1. Find the placeholder:

    1. `Enter_the_Application_Id_Here` and replace it with the Application (client) ID of the app you registered earlier.
    
    1. `Enter_the_Tenant_Subdomain_Here` and replace it with the Directory (tenant) subdomain. For example, if your tenant primary domain is `contoso.onmicrosoft.com`, use `contoso`. If you don't have your tenant name, learn how to [read your tenant details](https://learn.microsoft.com/entra/external-id/customers/how-to-create-customer-tenant-portal#get-the-customer-tenant-details).
     
    1. `Enter_the_Client_Secret_Here` and replace it with the app secret value you copied earlier.

## Run and test sample web app

You can now test the sample Node.js web app. You need to start the Node.js server and access it through your browser at `http://localhost:3000`.

1. In your terminal, run the following command:

    ```console
        npm start 
    ```

1. Open your browser, then go to http://localhost:3000.

1. After the page completes loading, select **Sign in** link. You're prompted to sign in.

1. On the sign-in page, type your **Email address**, select **Next**, type your **Password**, then select **Sign in**. If you don't have an account, select **No account? Create one** link, which starts the sign-up flow.

1. If you choose the sign-up option, after filling in your email, one-time passcode, new password and more account details, you complete the whole sign-up flow. You see a page similar to the following screenshot. You see a similar page if you choose the sign-in option.

    ![Screenshot](./ReadmeFiles/screenshot.png)

1. Select **Sign out** to sign the user out of the web app or select **View ID token claims** to view ID token claims returned by Microsoft Entra.

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

- Create an **Azure App Service**
- Publish the projects to the **App Services**, and
- Update its client(s) to call the website instead of the local environment.

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
* [Pass custom state in authentication requests using MSAL.js](https://learn.microsoft.com/entra/identity-platform/msal-js-pass-custom-state-authentication-request)