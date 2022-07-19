# Angular 14 RxJS7 MSAL Angular v2 Sample

This developer sample is used to demonstrate how to use `@azure/msal-angular`.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.0.0-next.7.

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

## Additional notes
- The default interaction type for the sample is redirects. The sample can be configured to use redirects by changing the `interactionType` in `app.module.ts` to `InteractionType.Popup`. 
- RxJSv6 is the default version of RxJS in MSAL-Angular v2. In order to use the installed version of RxJSv7 for this sample, ```"rxjs": ["./node_modules/rxjs"]``` must be added to the ```compilerOptions``` object's ```paths``` object in ```tsconfig.json```. This tells the compiler to use the version of RxJS specified in ```package.json``` (RxJSv7).
