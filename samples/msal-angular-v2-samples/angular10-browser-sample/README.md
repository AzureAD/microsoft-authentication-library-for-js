# Angular 10 MSAL-Browser Sample

## About this sample

This developer sample was created before `@azure/msal-angular@2` was available to demonstrate how to use `@azure/msal-browser` in an Angular application directly.

**`@azure/msal-angular@2` is now available for private preview. Please see the [`@azure/msal-angular` README](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) for information on installation, changes, and new samples.** 

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.6.

## How to run the sample

### Pre-requisites
- Ensure [all pre-requisites](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app.module.ts) have been completed to run msal-browser.

### Configure the application
- Open `./src/app/app.modules.ts` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration. 
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

### Running the sample
- In a command prompt, run `npm start`.
- Navigate to [http://localhost:4200](http://localhost:4200)
- In the web page, click on the "Login" button. The app will automatically reload if you change any of the source files.

## Additional notes
- The default interaction type for the sample is redirects. The sample can be configured to use popups by changing the `interactionType` in `app.module.ts` to `InteractionType.Popup`. 
