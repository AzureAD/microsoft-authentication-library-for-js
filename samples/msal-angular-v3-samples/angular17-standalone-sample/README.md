# Angular 17 Standalone MSAL Angular v3 Sample

This developer sample is used to demonstrate how to use `@azure/msal-angular` with Angular standalone components, and **does not** use the `MsalModule` or `NgModule`. Please see [Angular's docs on standalone](https://angular.io/guide/standalone-components) for more information.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.3, and uses Angular 17's application builder, but **does not** demonstrate use of server-side and prerendering capabilities. See [Angular's docs](https://angular.io/guide/esbuild) for more details.

## How to run the sample

### Pre-requisites
- Ensure [all pre-requisites](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/README.md) have been completed to run msal-angular.

### Configure the application
- Open `./src/main.ts` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration. 
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

### Running the sample
- In a command prompt, run `npm run start`.
- Navigate to [http://localhost:4200](http://localhost:4200)
- In the web page, click on the "Login" button. The app will automatically reload if you change any of the source files.

## Local development

If you are trying to run this sample locally in the MSAL.js repo, run `npm run build` before `npm run start` to install a tarball file of MSAL Angular.

## Additional notes
- This sample does not use the `MsalRedirectComponent`, but subscribes to `handleRedirectObservable` in the `app.component.ts` file. See our doc on [redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/redirects.md) for more information.
- The default interaction type for the sample is redirects. The sample can be configured to use redirects by changing the `interactionType` in `main.ts` to `InteractionType.Popup`. 
