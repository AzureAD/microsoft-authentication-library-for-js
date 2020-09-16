# MSAL Node Auth Code Sample

## About this sample
Use this sample to understand how MSAL Node works with a standard web app

## How to run the sample:

### Pre-requisites
- Understand [your scenario](https://docs.microsoft.com/en-us/azure/active-directory/develop/authentication-flows-app-scenarios) so you can register appropriately and pick the right sample 
- Register your app at [Azure](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps) following [this guidance](https://docs.microsoft.com/en-us/graph/auth-register-app-v2) and keep the registration window available
- Install this package via [npm](#installation)
- Download the sample code, configure, build, and test

## Installation

## Download sample code

1.  [Clone the MSAL.js repository](https://github.com/mvrak/microsoft-authentication-library-for-js.git), or with [Github Desktop](x-github-client://openRepo/https://github.com/mvrak/microsoft-authentication-library-for-js), or download just the sample files.
2.  Navigate to this sample directory.
3.  You will need package.json, index.js, and package-lock.json.

### Via NPM:
```javascript
npm install
```

## Configuration

Our sample app embeds configuration within index.js.  
```
const config = {
    auth: {
        clientId: "{1}",
        authority: "{2}",
        clientSecret: "{3}"
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};
```

1. The client ID, also know as the application ID, is retrieved from your registration on Azure.  This will be a GUID.  Update the GUID in the sample app with the GUID from your registration.
2. Update authority according to this [guidance](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration#authority).  We recommend `https://login.microsoftonline.com/common/` for broad coverage and ease of use.
3. Generate a client secret on Azure from within your app registration and include it here.

#### Start the App

From a command or powershell window, run `npm start` in the sample directory

#### Running the sample

- Navigate to `http://localhost:3000` to experience the sample.  As the sample does not contain UX, you are directed immediately to the web login.  Use a browser not currently signed in to a Microsoft account to see the full login experience.
