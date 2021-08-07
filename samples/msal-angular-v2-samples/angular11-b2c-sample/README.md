# Angular 11 MSAL Angular v2 B2C Sample

This developer sample is used to demonstrate how to use `@azure/msal-angular` on Azure AD B2C.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.1.

## How to run the sample

### Pre-requisites

- Ensure [all pre-requisites](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/README.md) have been completed to run msal-angular.

### B2C App Registration

This sample comes with a pre-registered application for demo purposes. If you would like to use your own **Azure AD B2C** tenant and application, follow the steps below:

1. [Create an Azure Active Directory B2C tenant](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-tenant)
2. [Register a single-page application in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-register-spa)
3. [Create user-flows in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-user-flows)

### Configure the application

Open `./src/app/app.module.ts` in an editor:

- Replace `clientId` with the Application (client) ID from the portal registration, or use the currently configured lab registration.
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

Open `.src/app/b2c-config.ts` in an editor:

- Replace `names`, `authorities` and `authorityDomain` fields in `b2cPolicies` object with the parameters you've obtained after creating your own user-flows.
  - Optionally, replace the `uri` and `scopes` fields in `apiConfig` object if you would like to call your own web API registered on Azure AD B2C (see: [Register a web API on Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/add-web-api-application?tabs=app-reg-ga))

### Running the sample

- In a command prompt, run `npm start`.
- Navigate to [http://localhost:4200](http://localhost:4200)
- In the web page, click on the "Login" button. The app will automatically reload if you change any of the source files.

### How to handle B2C user-flows

Implementing B2C user-flows is a matter of initiating authorization requests against the corresponding authorities. This sample demonstrates [sign-up/sign-in](https://docs.microsoft.com/azure/active-directory-b2c/add-sign-up-and-sign-in-policy?pivots=b2c-user-flow) (with [self-service password reset](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#self-service-password-reset-recommended)) and [edit-profile](https://docs.microsoft.com/azure/active-directory-b2c/add-profile-editing-policy?pivots=b2c-user-flow) user-flows.

> For implementing legacy [password-reset](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#password-reset-policy-legacy) user-flow, which is slightly more complex, see the code sample: [Angular SPA using MSAL-Angular v1 on Azure AD B2C](https://github.com/Azure-Samples/active-directory-b2c-javascript-angular-spa).

## Additional notes

- The default interaction type for the sample is redirect. The sample can be configured to use popups by changing the `interactionType` in `app.module.ts` to `InteractionType.Popup`.

- If you would like to protect all the routes in your application so that upon hitting any page, users are automatically prompted for login, follow the [steps outlined in FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/FAQ.md#how-do-i-log-users-in-when-they-hit-the-application)

## Common errors

- If your app is running into redirect loops when trying to acquire a token for a resource such as your web API, make sure you have granted **admin consent** to the permissions/scopes required for that resource on App registration portal. See [Using redirects in MSAL Angular v2](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more on redirect experience. See [MSAL Angular v2 Errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md) for other common errors.
