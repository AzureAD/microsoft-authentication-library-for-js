# Angular 11 MSAL Angular v2 Sample

This developer sample is used to demonstrate how to use `@azure/msal-angular`.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.1.

## How to run the sample

### Pre-requisites
- Ensure [all pre-requisites](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/README.md) have been completed to run msal-angular.

### Configure the application
- Open `./src/app/app.modules.ts` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration. 
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

### Running the sample
- In a command prompt, run `npm start`.
- Navigate to [http://localhost:4200](http://localhost:4200)
- In the web page, click on the "Login" button. The app will automatically reload if you change any of the source files.

## Running the sample with Angular Universal SSR
Please see instructions from the [Angular docs](https://angular.io/guide/universal) on how to install Angular Universal with this existing sample, and our [Angular Universal doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/angular-universal.md) for using Angular Universal with MSAL Angular. Comments have been added to this sample where adjustments need to be made. 

## Additional notes
- The default interaction type for the sample is redirect. The sample can be configured to use popups by changing the `interactionType` in `app.module.ts` to `InteractionType.Popup`. 
- This sample demonstrates the use of `canActivateChild` and `canLoad` in the `app-routing.module.ts`, and has more components and modules than the other available samples. See our [initialization doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#secure-the-routes-in-your-application) for more information on securing routes.
