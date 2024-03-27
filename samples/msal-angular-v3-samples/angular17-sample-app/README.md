# Angular 17 MSAL Angular v3 Sample

This developer sample is used to demonstrate how to use `@azure/msal-angular`.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.0.

## How to run the sample

### Pre-requisites
- Ensure [all pre-requisites](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/README.md) have been completed to run msal-angular.

### Configure the application
- Open `./src/environments/environment.ts` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration. 
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

### Running the sample
- In a command prompt, run `npm start`.
- Navigate to [http://localhost:4200](http://localhost:4200)
- In the web page, click on the "Login" button. The app will automatically reload if you change any of the source files.

## Additional notes
- This sample application uses Angular 17's default `application` builder which allows for server-side rendering. To accommodate this, references to browser-only objects have been removed. However, as MSAL Angular is a wrapper library for MSAL Browser, which uses browser-only global objects such as window and location objects, not all of MSAL Angular's features are available when using server-side rendering. While login and token acquisition is not supported server-side, Angular 17 can be used with MSAL Angular without breaking your app.
- The default interaction type for the sample is redirects. The sample can be configured to use redirects by changing the `interactionType` in `app.module.ts` to `InteractionType.Popup`. 
