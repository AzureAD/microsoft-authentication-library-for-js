---
page_type: sample
name: A Node.js & Express web app that signs in users by using Microsoft Entra External ID for Customers with MSAL Node
description: This sample demonstrates a Node.js & Express web app authenticating users by using Microsoft Entra External ID for Customers with Microsoft Authentication Library for Node (MSAL Node)
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

# A Node.js & Express web app authenticating users by using Microsoft Entra External ID for Customers

* [Usage](#usage)
* [Overview](#overview)
* [Scenario](#scenario)
* [Contents](#contents)
* [Prerequisites](#prerequisites)
* [Setup the sample](#setup-the-sample)
* [Explore the sample](#explore-the-sample)
* [Troubleshooting](#troubleshooting)
* [About the code](#about-the-code)
* [Contributing](#contributing)
* [Learn More](#learn-more)

## Usage

|          Instruction  |                Description                 |
|-----------------------|--------------------------------------------|
| **Use case**          | This code sample applies to **customer configuration uses case**![Yes button](yes.png "Title"). If you're looking for a workforce configuration use case, use [Tutorial: Enable a Node.js (Express) application to sign in users by using Microsoft Entra ID](https://github.com/Azure-Samples/ms-identity-node)      |
| **Scenario**        | Sign in users. You acquire an ID token by using authorization code flow with PKCE. |
|    **Add sign in to your app**        | Use the instructions in [Sign in users in a Node.js web app](https://learn.microsoft.com/entra/external-id/customers/tutorial-web-app-node-sign-in-prepare-tenant) to learn how to add sign in to your Node web app. |
|**Product documentation** | Explore [Microsoft Entra ID for customers documentation](https://review.learn.microsoft.com/entra/external-id/customers/) |

## Overview

This sample demonstrates how sign in users into a a Node.js & Express web app by using Microsoft Entra External ID for Customers. The samples utilizes the [Microsoft Authentication Library for Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) (MSAL Node) to simplify adding authentication to the Node.js web app.

## Contents

| File/folder           | Description                                |
|-----------------------|--------------------------------------------|
| `App/app.js`          | Application entry point.                   |
| `App/authConfig.js`   | Contains authentication parameters such as your tenant sub-domain, Application (Client) ID, app client secret and redirect URI.        |
| `App/auth/AuthProvider.js`  | The main authentication logic resides here.    |

## Prerequisites

* You must install in your computer [Node.js](https://nodejs.org/en/download/) to run this sample.
* We recommend [Visual Studio Code](https://code.visualstudio.com/download) for running and editing this sample.
* [VS Code Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-node-azure-pack) extension is recommended for interacting with Azure through VS Code Interface.
* An **Azure AD for Customers** tenant. For more information, see: [How to get an Azure AD for Customers tenant](https://github.com/microsoft/entra-previews/blob/PP2/docs/1-Create-a-CIAM-tenant.md)
* Microsoft Entra ID for customers tenant. If you don't already have one, [sign up for a free trial](https://aka.ms/ciam-free-trial).


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

> :note: This sample can make use of client certificates. You can use **AppCreationScripts** to register an Microsoft Entra ID application with certificates. For more information see, [Use client certificate for authentication in your Node.js web app instead of client secrets](https://review.learn.microsoft.com/entra/external-id/customers/how-to-web-app-node-use-certificate).

</details>

To manually register your apps in Microsoft Entra Admin center, follow these steps:

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) as at least an [Application Developer](https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference#application-developer).
1. If you have access to multiple tenants, use the **Settings** icon (![settings icon](admin-center-settings-icon.png "Title")) in the top menu to switch to your customer tenant from the **Directories + subscriptions** menu. 
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

## Create user Flows

Follow these steps to create a user flow a customer can use to sign in or sign up for an application.

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) as at least an [External ID User Flow Administrator](https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference#external-id-user-flow-administrator).  
1. If you have access to multiple tenants, use the **Settings** icon (![settings icon](admin-center-settings-icon.png "Title")) in the top menu to switch to your customer tenant from the **Directories + subscriptions** menu.
1. Browse to **Identity** > **External Identities** > **User flows**.
1. Select **+ New user flow**.
1. On the **Create** page:

   1. Enter a **Name** for the user flow, such as *SignInSignUpSample*.
   1. In the **Identity providers** list, select **Email Accounts**. This identity provider allows users to sign-in or sign-up using their email address.
   
         > note: Additional identity providers will be listed here only after you set up federation with them. For example, if you set up federation with [Google](https://learn.microsoft.com/entra/external-id/customers/how-to-google-federation-customers) or [Facebook](https://learn.microsoft.com/entra/external-id/customers/how-to-facebook-federation-customers), you'll be able to select those additional identity providers here.  

   1. Under **Email accounts**, you can select one of the two options. For this tutorial, select **Email with password**.

      - **Email with password**: Allows new users to sign up and sign in using an email address as the sign-in name and a password as their first factor credential.  
      - **Email one-time-passcode**: Allows new users to sign up and sign in using an email address as the sign-in name and email one-time passcode as their first factor credential.

         > note: Email one-time passcode must be enabled at the tenant level (**All Identity Providers** > **Email One-time-passcode**) for this option to be available at the user flow level.

   1. Under **User attributes**, choose the attributes you want to collect from the user upon sign-up. By selecting **Show more**, you can choose attributes and claims for **Country/Region**, **Display Name**, and **Postal Code**. Select **OK**. (Users are only prompted for attributes when they sign up for the first time.)

1. Select **Create**. The new user flow appears in the **User flows** list. If necessary, refresh the page.

To enable self-service password reset, use the steps in [Enable self-service password reset](https://learn.microsoft.com/entra/external-id/customers/how-to-enable-password-reset-customers) article.

## Associate the web application with the user flow

Although many applications can be associated with your user flow, a single application can only be associated with one user flow. A user flow allows configuration of the user experience for specific applications. For example, you can configure a user flow that requires users to sign-in or sign-up with a phone number or email address.

1. On the sidebar menu, select **Identity**.
1. Select **External Identities**, then **User flows**.
1. In the **User flows** page, select the **User flow name** you created earlier, for example, _SignInSignUpSample_.
1. Under **Use**, select **Applications**.
1. Select **Add application**.
   <!--[Screenshot the shows how to associate an application to a user flow.](media/20-create-user-flow-add-application.png)-->
1. Select the application from the list such as *ciam-client-app* or use the search box to find the application, and then select it.

1. Choose **Select**.




## Clone or download sample web application

From your shell or command line:

```console
git clone https://github.com/Azure-Samples/ms-identity-ciam-javascript-tutorial.git
```


### Step 2: Install project dependencies

```console
    cd 1-Authentication\5-sign-in-express\App
    npm install
```


### Step 4: Running the sample

```console
    cd 1-Authentication\5-sign-in-express\App
    npm start
```

## Configure the client app (ciam-msal-node-webapp) to use your app registration


## Explore the sample

1. Open your browser and navigate to `http://localhost:3000`.
1. Select the **Sign In** link.
1. Select the **View ID token claims** link to see the claims in your ID token.

![Screenshot](./ReadmeFiles/screenshot.png)

> :information_source: Did the sample not work for you as expected? Then please reach out to us using the [GitHub Issues](../../../../issues) page.

## We'd love your feedback!

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_ivMYEeUKlEq8CxnMPgdNZUNDlUTTk2NVNYQkZSSjdaTk5KT1o4V1VVNS4u).

## Troubleshooting

<details>
	<summary>Expand for troubleshooting info</summary>

> * Use [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) to get support from the community. Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
Make sure that your questions or comments are tagged with [`azure-active-directory-b2c` `node` `ms-identity` `adal` `msal-js` `msal`].

To provide feedback on or suggest features for Azure Active Directory, visit [User Voice page](https://feedback.azure.com/d365community/forum/79b1327d-d925-ec11-b6e6-000d3a4f06a4).
</details>

## About the code

### Initialization

// Explain how the app is configured

### Sign-in

// Explain how the app signs in users

### Sign-out

To sing-out the current user, the app destroys the session that holds user data and navigates the browser to the Azure AD logout endpoint to end the session with Azure AD. This is shown in [auth.js](./App/routes/auth.js):

```javascript
```

### Deploying Web app to Azure App Service

There is one web app in this sample. To deploy it to **Azure App Services**, you'll need to:

- create an **Azure App Service**
- publish the projects to the **App Services**, and
- update its client(s) to call the website instead of the local environment.

> :information_source: If you would like to use **VS Code Azure Tools** extension for deployment, [watch the tutorial](https://docs.microsoft.com/azure/developer/javascript/tutorial-vscode-azure-app-service-node-01) offered by Microsoft Docs.

#### Deploy your files (ciam-msal-node-webapp)

1. In the **VS Code** activity bar, select the **Azure** logo to show the **Azure App Service** explorer. Select **Sign in to Azure...** and follow the instructions. Once signed in, the explorer should show the name of your **Azure** subscription(s).
2. On the **App Service** explorer section you will see an upward-facing arrow icon. Click on it publish your local files in the project folder to **Azure App Services** (use "Browse" option if needed, and locate the right folder).
3. Choose a creation option based on the operating system to which you want to deploy. in this sample, we choose **Linux**.
4. Select a **Node.js** version when prompted. An **LTS** version is recommended.
5. Type a globally unique name for your web app and press Enter. The name must be unique across all of **Azure**. (e.g. `ciam-msal-node-webapp`)
6. After you respond to all the prompts, **VS Code** shows the **Azure** resources that are being created for your app in its notification popup.
7. Select **Yes** when prompted to update your configuration to run `npm install` on the target **Linux** server.

#### Update the CIAM app registration (ciam-msal-node-webapp)

1. Navigate back to to the [Azure portal](https://portal.azure.com).
In the left-hand navigation pane, select the **Azure Active Directory** service, and then select **App registrations (Preview)**.
1. In the resulting screen, select the `ciam-msal-node-webapp` application.
1. In the app's registration screen, select **Authentication** in the menu.
    1. In the **Redirect URIs** section, update the reply URLs to match the site URL of your Azure deployment. For example:
        1. `https://ciam-msal-node-webapp.azurewebsites.net`
        1. `https://ciam-msal-node-webapp.azurewebsites.net/auth/redirect`

> :warning: If your app is using an *in-memory* storage, **Azure App Services** will spin down your web site if it is inactive, and any records that your app was keeping will be empty. In addition, if you increase the instance count of your website, requests will be distributed among the instances. Your app's records, therefore, will not be the same on each instance.
</details>

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Learn More

* [Customize the default branding](https://github.com/microsoft/entra-previews/blob/PP2/docs/5-Customize-default-branding.md)
* [OAuth 2.0 device authorization grant flow](https://github.com/microsoft/entra-previews/blob/PP2/docs/9-OAuth2-device-code.md)
* [Customize sign-in strings](https://github.com/microsoft/entra-previews/blob/PP2/docs/8-Customize-sign-in-strings.md)
* [Building Zero Trust ready apps](https://aka.ms/ztdevsession)
* [Initialize client applications using MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-initializing-client-applications)
* [Single sign-on with MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso)
* [Handle MSAL.js exceptions and errors](https://docs.microsoft.com/azure/active-directory/develop/msal-handling-exceptions?tabs=javascript)
* [Logging in MSAL.js applications](https://docs.microsoft.com/azure/active-directory/develop/msal-logging?tabs=javascript)
* [Pass custom state in authentication requests using MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-pass-custom-state-authentication-request)
* [Prompt behavior in MSAL.js interactive requests](https://docs.microsoft.com/azure/active-directory/develop/msal-js-prompt-behavior)
* [Use MSAL.js to work with Azure AD B2C](https://docs.microsoft.com/azure/active-directory/develop/msal-b2c-overview)
