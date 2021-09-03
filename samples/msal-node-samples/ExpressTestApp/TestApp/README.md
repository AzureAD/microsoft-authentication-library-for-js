# Overview

This sample demonstrates a Node.js & Express web application that authenticates users against [Azure Active Directory](https://docs.microsoft.com/azure/active-directory/fundamentals/active-directory-whatis) (Azure AD) and obtains [Access Tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) to call the [Microsoft Graph API](https://docs.microsoft.com/graph/overview) (Graph API) and the [Azure Resource Manager API](https://docs.microsoft.com/azure/azure-resource-manager/management/overview) (ARM API), with the help of [Microsoft Authentication Library for Node.js](https://aka.ms/msalnode) (MSAL Node).

## Scenario

1. The client application uses the **MSAL Node** to sign-in a user and obtain a JWT **Access Token** from **Azure AD**.
1. The **Access Token** is used as a *bearer* token to authorize the user to access the **resource** (Graph API or ARM API).
1. The **resource** responds with the data that the user has access to.

## Contents

| File/folder                         | Description                                                   |
|-------------------------------------|---------------------------------------------------------------|
| `App/appSettings.json`              | Application settings and authentication parameters.           |
| `App/app.js`                        | Application entry point.                                      |
| `App/routes/router.js`              | Application routes are defined here.                          |
| `App/controllers/mainController.js` | Main application controllers.                                 |
| `App/utils/cachePlugin.js`          | Example cache plugin implementation for saving cache to disk. |

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) must be installed to run this sample.
- [Visual Studio Code](https://code.visualstudio.com/download) is recommended for running and editing this sample.
- An **Azure AD** tenant. For more information, see: [How to get an Azure AD tenant](https://docs.microsoft.com/azure/active-directory/develop/quickstart-create-new-tenant)
- A user account in your **Azure AD** tenant.

## Setup

Locate the root of the sample folder (i.e. `TestApp`). Then:

```console
    npm install
```

## Registration

### Register the web app

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `ExpressWebApp`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
   - In the **Redirect URI (optional)** section, select **Web** in the combo-box and enter the following redirect URI: `http://localhost:4000/redirect`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. Select **Save** to save your changes.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left to open the page where we can generate secrets and upload certificates.
1. In the **Client secrets** section, select **New client secret**:
   - Type a key description (for instance `app secret`),
   - Select one of the available key durations (**In 1 year**, **In 2 years**, or **Never Expires**) as per your security posture.
   - The generated key value will be displayed when you select the **Add** button. Copy the generated value for use in the steps later.
   - You'll need this key later in your code's configuration files. This key value will not be displayed again, and is not retrievable by any other means, so make sure to note it from the Azure portal before navigating to any other screen or blade.
1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs.
   - Select the **Add a permission** button and then,
   - Ensure that the **Microsoft APIs** tab is selected.
   - In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
   - In the **Delegated permissions** section, select the **User.Read** in the list. Use the search box if necessary.
   - Select the **Add permissions** button at the bottom.
1. Still in the **API permissions** blade,
   - Select the **Add a permission** button and then,
   - Ensure that the **Microsoft APIs** tab is selected.
   - In the *Commonly used Microsoft APIs* section, select **Azure Service Management**
   - In the **Delegated permissions** section, select the **user_impersonation** in the list. Use the search box if necessary.
   - Select the **Add permissions** button at the bottom.

### Configure the web app to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `./App/appSettings.json` file.
1. Find the key `clientId` and replace the existing value with the **application ID** (clientId) of the `ExpressWebApp` application copied from the Azure Portal.
1. Find the key `tenantId` and replace the existing value with your Azure AD **tenant ID**.
1. Find the key `clientSecret` and replace the existing value with the key you saved during the creation of the `ExpressWebApp` app, in the Azure Portal.
1. Find the key `homePageRoute` and replace the existing value with the route that you wish to be redirected after sign-in, e.g. `/home`.
1. Find the key `redirectUri` and replace the existing value with the **Redirect URI** for `ExpressWebApp` app. For example, `http://localhost:4000/redirect`.
1. Find the `postLogoutRedirectUri` and replace the existing value with the URI that you wish to be redirected after sign-out, e.g. `http://localhost:4000/`

## Running the sample

Locate the root of the sample folder (i.e. `TestApp`). Then:

```console
    npm start
```

## Explore the sample

1. Open your browser and navigate to `http://localhost:4000`.
1. Click the **Sign-in** button on the top right corner.
1. Once you sign-in, click on the **See my profile** button to call **Microsoft Graph**.
1. Once you sign-in, click on the **Get my tenant** button to call **Azure Resource Manager**.
