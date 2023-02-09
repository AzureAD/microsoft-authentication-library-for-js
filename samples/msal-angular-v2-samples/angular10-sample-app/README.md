# Angular 10 MSAL Angular v2 Sample

This developer sample is used to demonstrate how to use `@azure/msal-angular`.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.6.

## How to run the sample

### Pre-requisites
- Ensure [all pre-requisites](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/README.md) have been completed to run msal-angular.

### Configure the application
- Open `.src/environments/environment.ts` in an editor:
- Replace `ENTER_CLIENT_ID_HERE` with the Application (client) ID from the app registration portal
- Replace `ENTER_TENANT_ID_HERE` with the tenant ID from the app registration portal

These parameters are taken in during runtime to initialize MSAL in `./src/app/app.module.ts`.

### Running the sample
- In a command prompt, run `npm start`.
- Navigate to [http://localhost:4200](http://localhost:4200)
- In the web page, click on the "Login" button. The app will automatically reload if you change any of the source files.

## Additional notes
- The default interaction type for the sample is redirects. The sample can be configured to use redirects by changing the `interactionType` in `app.module.ts` to `InteractionType.Popup`. 
