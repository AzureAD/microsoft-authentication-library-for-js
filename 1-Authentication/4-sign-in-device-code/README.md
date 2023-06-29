---
page_type: sample
name: A Node headless application using MSAL Node to authenticate users with the device code flow against Customer Identity Access Management (CIAM)
description: A Node headless application using MSAL Node to authenticate users with the device code flow against Customer Identity Access Management (CIAM)
languages:
 - javascript
products:
 - entra-external-id
 - msal-js
 - msal-node
urlFragment: ms-identity-ciam-javascript-tutorial-4-sign-in-device-code
extensions:
    services: 
    - ms-identity
    platform: 
    - javascript
    endpoint: 
    - AAD v2.0
    level: 
    - 100
    client: 
    - Node headless application
---

# A Node headless application using MSAL Node to authenticate users with the device code flow against Customer Identity Access Management (CIAM)

* [Overview](#overview)
* [Scenario](#scenario)
* [Prerequisites](#prerequisites)
* [Setup the sample](#setup-the-sample)
* [Explore the sample](#explore-the-sample)
* [Troubleshooting](#troubleshooting)
* [About the code](#about-the-code)
* [Contributing](#contributing)
* [Learn More](#learn-more)

## Overview

This sample demonstrates a Node headless application that authenticates users with the [device code flow](https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-device-code) against Azure AD for Customers.

## Scenario

1. The client Node headless application uses MSAL Node to sign-in a user and obtain a JWT [ID Token](https://aka.ms/id-tokens) from **Azure AD for Customers**.
1. The **ID Token** proves that the user has successfully authenticated against **Azure AD for Customers**.

![Scenario Image](./ReadmeFiles/topology.png)

## Contents

| File/folder                | Description                                      |
|----------------------------|--------------------------------------------------|
| `index.js`                 | Main authentication logic resides here.          | 
| `authConfig.js`            | Contains authentication parameters.              |

## Prerequisites

* An **Azure AD for Customers** tenant. For more information, see: [How to get an Azure AD for Customers tenant](https://github.com/microsoft/entra-previews/blob/PP2/docs/1-Create-a-CIAM-tenant.md)
* A user account in your **Azure AD for Customers** tenant.

>This sample will not work with a **personal Microsoft account**. If you're signed in to the [Azure portal](https://portal.azure.com) with a personal Microsoft account and have not created a user account in your directory before, you will need to create one before proceeding.

## Setup the sample

### Step 1: Clone or download this repository

From your shell or command line:

```console
git clone https://github.com/Azure-Samples/ms-identity-ciam-javascript-tutorial.git
```

or download and extract the repository *.zip* file.

> :warning: To avoid path length limitations on Windows, we recommend cloning into a directory near the root of your drive.

### Step 2: Install project dependencies

```console
    cd 1-Authentication\4-sign-in-device-code\App
    npm install
```

### Step 3: Register the sample application(s) in your tenant

There is one project in this sample. To register it, you can:

* follow the steps below for manually register your apps
* or use PowerShell scripts that:
  * **automatically** creates the Azure AD applications and related objects (passwords, permissions, dependencies) for you.
  * modify the projects' configuration files.

<details>
   <summary>Expand this section if you want to use this automation:</summary>

> :warning: If you have never used **Microsoft Graph PowerShell** before, we recommend you go through the [App Creation Scripts Guide](./AppCreationScripts/AppCreationScripts.md) once to ensure that your environment is prepared correctly for this step.
  
1. On Windows, run PowerShell as **Administrator** and navigate to the root of the cloned directory
1. In PowerShell run:

    ```PowerShell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
    ```

1. Run the script to create your Azure AD application and configure the code of the sample application accordingly.
1. For interactive process -in PowerShell, run:

    ```PowerShell
    cd .\AppCreationScripts\
    .\Configure.ps1 -TenantId "[Optional] - your tenant id" -AzureEnvironmentName "[Optional] - Azure environment, defaults to 'Global'"
    ```

> Other ways of running the scripts are described in [App Creation Scripts guide](./AppCreationScripts/AppCreationScripts.md). The scripts also provide a guide to automated application registration, configuration and removal which can help in your CI/CD scenarios.

</details>

#### Choose the Azure AD for Customers tenant where you want to create your applications

To manually register the apps, as a first step you'll need to:

1. Sign in to the [Azure portal](https://portal.azure.com).
1. If your account is present in more than one directory, make sure you're using the directory that contains your Azure AD for Customers tenant:
    1. Select the **Directories + subscriptions** icon in the portal toolbar.
    1. On the **Portal settings | Directories + subscriptions** page, find your Azure AD for Customers tenant in the Directory name list, and then select **Switch**

#### Create User Flows

Please refer to: [Tutorial: Create user flow in Azure Active Directory CIAM](https://github.com/microsoft/entra-previews/blob/PP2/docs/3-Create-sign-up-and-sign-in-user-flow.md)

> :information_source: To enable password reset in Customer Identity Access Management (CIAM) in Azure Active Directory (Azure AD), please refer to: [Tutorial: Enable self-service password reset](https://github.com/microsoft/entra-previews/blob/PP2/docs/4-Enable-password-reset.md)

#### Add External Identity Providers

Please refer to:

* [Tutorial: Add Google as an identity provider](https://github.com/microsoft/entra-previews/blob/PP2/docs/6-Add-Google-identity-provider.md)
* [Tutorial: Add Facebook as an identity provider](https://github.com/microsoft/entra-previews/blob/PP2/docs/7-Add-Facebook-identity-provider.md)

#### Register the client app (msal-node-headless)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD for Customers** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    1. In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-headless`.
    1. Under **Supported account types**, select **Accounts in this organizational directory only**
    1. Select **Register** to create the application.
1. In the **Overview** blade, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. In the app's registration screen, select the **Authentication** blade to the left.
1. In the **Advanced settings** | **Allow public client flows** section, flip the switch for `Treat application as a public client` to **Yes**.
    1. Click **Save** to save your changes.
1. Since this app signs-in users, we will now proceed to select **delegated permissions**, which is required by apps signing-in users.
    1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs:
    1. Select the **Add a permission** button and then:
    1. Ensure that the **Microsoft APIs** tab is selected.
    1. In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
    1. In the **Delegated permissions** section, select **openid**, **offline_access** in the list. Use the search box if necessary.
    1. Select the **Add permissions** button at the bottom.
1. At this stage, the permissions are assigned correctly, but since it's a CIAM tenant, the users themselves cannot consent to these permissions. To get around this problem, we'd let the [tenant administrator consent on behalf of all users in the tenant](https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent). Select the **Grant admin consent for {tenant}** button, and then select **Yes** when you are asked if you want to grant consent for the requested permissions for all accounts in the tenant. You need to be a tenant admin to be able to carry out this operation.

##### Configure the client app (msal-node-headless) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `App\authConfig.js` file.
1. Find the placeholder `Enter_the_Tenant_Subdomain_Here` and replace it with the Directory (tenant) subdomain. For instance, if your tenant primary domain is `contoso.onmicrosoft.com`, use `contoso`. If you don't have your tenant domain name, learn how to [read your tenant details](https://review.learn.microsoft.com/azure/active-directory/external-identities/customers/how-to-create-customer-tenant-portal#get-the-customer-tenant-details).
1. Find the key `Enter_the_Application_Id_Here` and replace the existing value with the application ID (clientId) of `msal-node-headless` app copied from the Azure portal.

### Step 4: Running the sample

```console
    cd 1-Authentication\4-sign-in-device-code\App
    npm start
```

## Explore the sample

1. Navigate to the project directory and run the `npm start` command.
1. Copy the suggested URL `https://microsoft.com/devicelogin` from the message in the terminal and open it in the browser. Then copy the device code from the message in the terminal.
![Screenshot](./ReadmeFiles/code.png)
1. Past the code in the Enter code prompt to sign in. <br />
![Screenshot](./ReadmeFiles/prompt.png)
1. Head back to the terminal to see your authentication information.

> :information_source: Did the sample not work for you as expected? Then please reach out to us using the [GitHub Issues](../../../../issues) page.

## We'd love your feedback!

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR_ivMYEeUKlEq8CxnMPgdNZUNDlUTTk2NVNYQkZSSjdaTk5KT1o4V1VVNS4u).

## Troubleshooting

<details>
	<summary>Expand for troubleshooting info</summary>


To provide feedback on or suggest features for Azure Active Directory, visit [User Voice page](https://feedback.azure.com/d365community/forum/79b1327d-d925-ec11-b6e6-000d3a4f06a4).
</details>

## About the code

MSAL Node exposes [acquireTokenByDeviceCode](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.publicclientapplication.html#acquiretokenbydevicecode) API to support the [device authorization grant](https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-device-code), which allows users to sign in to input-constrained devices such as a smart TV, IoT device, or a printer. To enable this flow, the device has the user visit a webpage in a browser on another device to sign in as shown in the code below:

```javascript
const getTokenDeviceCode = (clientApplication) => {
    
    /**
     * Device Code Request for more information visit:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#devicecoderequest
     */
    const deviceCodeRequest = {
        ...loginRequest,
        deviceCodeCallback: (response) => {
            console.log(response.message);
        },
    };

    /**
     * The code below demonstrates the correct usage pattern of the acquireTokenByDeviceCode API.
     * The application uses MSAL to obtain an Access Token through the Device Code grant.
     * Once the device code request is executed, the user will be prompted by the headless application to visit a URL,
     * where they will input the device code shown in the console. Once the code is entered, the promise below should resolve
     * with an AuthenticationResult object. For information about acquireTokenByDeviceCode see:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.publicclientapplication.html#acquiretokenbydevicecode
     *
     */
    return clientApplication
        .acquireTokenByDeviceCode(deviceCodeRequest)
        .then((response) => {
            return response;
        })
        .catch((error) => {
            return error;
        });
}
```

Once the user signs in, the device is able to get the user's authentication information.

```javascript
getTokenDeviceCode(msalInstance).then(response => {
    console.log(response)
});
```

</details>

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Learn More

* [Customize the default branding](https://github.com/microsoft/entra-previews/blob/PP2/docs/5-Customize-default-branding.md)
* [OAuth 2.0 device authorization grant flow](https://github.com/microsoft/entra-previews/blob/PP2/docs/9-OAuth2-device-code.md)
* [Customize sign-in strings](https://github.com/microsoft/entra-previews/blob/PP2/docs/8-Customize-sign-in-strings.md)
* [Building Zero Trust ready apps](https://aka.ms/ztdevsession)
