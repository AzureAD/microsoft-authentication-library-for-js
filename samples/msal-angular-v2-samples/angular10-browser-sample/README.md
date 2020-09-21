# Angular 10 MSAL.js 2.x Sample

## About this sample

This developer sample is used to demonstrate how to use MSAL.js in Angular 10.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.6.

## How to run the sample

### Pre-requisites
- Ensure [all pre-requisites](../../../lib/msal-browser/README.md#prerequisites) have been completed to run msal-browser.

### Configure the application
- Open `./src/app/app.modules.ts` in an editor.
- Replace client id with the Application (client) ID from the portal registration, or use the currently configured lab registration. 
  - Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

### Running the sample
- In a command prompt, run `npm start`.
- Navigate to [http://localhost:4200](http://localhost:4200)
- In the web page, click on the "Login" button. The app will automatically reload if you change any of the source files.

## Additional notes
- The default interaction type for the sample is popups. The sample can be configured to use redirects by changing the `interactionType` in `app.module.ts` to `InteractionType.REDIRECT`. Note that there are current issues with using redirects, such as updating state and the asynchronous processing of redirect responses. These issues are being investigated and will be addressed.
- The sample implements basic versions of Angular service, guard, and interceptors. Broadcast functionality has not been implemented.
