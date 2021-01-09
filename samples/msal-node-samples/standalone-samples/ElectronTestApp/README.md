# MSAL Node Electron Sample

An Electron application built with TypeScript that uses the MSAL Node library to acquire and store access tokens to authenticate with the Microsoft Graph API. 

## Should I use this sample:

Understanding the way MSAL Node is used in this sample will help you if you're interested in building an Electron.js application to authenticate and acquire tokens using AzureAD.

## How to run the samples:

### Clone this repository

First, clone the MSAL directory:

SSH:

```bash
$ git clone git@github.com:AzureAD/microsoft-authentication-library-for-js.git
```

HTTP:

```bash
$ git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
```

You can also download the repository as a zip file by selecting "Download ZIP" from the root repository's dropdown "Code" menu. Once you've downloaded the ZIP file, you can decompress it locally and explore the code.

### Pre-requisites
- By using MSAL Node, you are working with the Microsoft Identity ecosystem. Read about [App Registrations](https://docs.microsoft.com/en-us/graph/auth-register-app-v2) and register one for use with this code.
- Install [Node.js](https://nodejs.org/en/), [Electron.js](https://www.electronjs.org/) and [TypeScript](https://www.typescriptlang.org/) if needed.
- Install the MSAL Node package:  
```bash
npm install @azure/msal-node
```
- If you are customizing or building locally, navigate to the `lib/msal-node` directory and build it using the following command:
```bash
npm run build:package
```
- From the repository's root directory, navigate to the Electron sample application:

```bash
$ cd samples/msal-node-samples/standalone-samples/ElectronTestApp
```

### Configure the application

The MSAL configuration object in the ElectronTestApp is defined in the `AuthProvider.ts` file. Look for the `MSAL_CONFIG` object and update the clientId and authority to match your [App Registration](https://docs.microsoft.com/en-us/graph/auth-register-app-v2).

```javascript
const MSAL_CONFIG: Configuration = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY",
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        }
    }
};
```

This application uses the `User.Read` and `Mail.Read` Microsoft Graph Scopes, so make sure they are enabled in your App Registration.

**Note: If you'd like to configure custom scopes for this sample application, you'll need to modify the request scopes in the `setRequestObjects()` method within `AuthProvider.ts`.**

#### Custom File Protocols and Redirect URIs

To demonstrate best security practices, this Electron sample application makes use of a custom file protocol instead of a regular web (https://) redirect URI in order to handle the redirection step of the authorization flow, as suggested in the [OAuth2.0 specification for Native Apps](https://tools.ietf.org/html/rfc8252#section-7.1).

The reason this applies to Electron applications (such as this one) is that, although Electron uses Chromium to support browser-based JavaScript, it also has access to operating system resources, which makes it a Public Client Native Application under OAuth 2.0 and requires extra security considerations.

On the Electron side of this sample application, the name of the custom file protocol ("msal" by default) is declared as a constant in the `AuthProvider` class:

```typescript
const CUSTOM_FILE_PROTOCOL_NAME = "msal";
```

The way the sample is configured, during authentication, the application will listen for requests and responses to URIs beginning with `"msal://"`.

Further down in the `AuthProvider` class, the `setRequestObjects()` method defines the `redirectUri` that will be sent in the authentication request and for which the application will be listening to redirect requests on:


```typescript
 private setRequestObjects(): void {
        const requestScopes =  ['openid', 'profile', 'User.Read'];
        const redirectUri = "msal://redirect"; // Redirect URI for custom file scheme
        ...
 }
```

Both of these values, the `redirectUri` and `CUSTOM_FILE_PROTOCOL_NAME` are partially arbitrary and can be customized to your preference (ideally they shouldn't be obvious to guess and should follow the suggestions in the [OAuth2.0 specification for Native Apps](https://tools.ietf.org/html/rfc8252#section-8.4) specification). The only thing that matters is that the `redirectUri` is a format that begins with `"CUSTOM_FILE_PROTOCOL_NAME://"` and followed by any path component (required).

For example, the following pairs of values should work:

```typescript
/// Ex 1:
const CUSTOM_FILE_PROTOCOL = "msal"
const redirectUri = "msal://auth"

/// Ex 2:
const CUSTOM_FILE_PROTOCOL = "sampleapp"
const redirectUri = "sampleapp://redirect"

/// Ex 3:
const CUSTOM_FILE_PROTOCOL = "com.sampleapp"
const redirectUri = "com.sampleapp://auth"
```

#### Registering a custom file protocol URI as a Redirect URI

Whether or not you decide to customize these values, you must register the `redirectUri` in the Azure Portal as a Mobile or Desktop Redirect URI.

1. Go to the App Registration in the Azure Portal.
2. Click the `Authentication` tab in the side menu.
3. Under "Platform configurations", click the "Add a platform" link.
4. Select "Mobile and desktop applications".
5. Copy the exact `redirectUri` value (`msal://redirect` is the default if you don't want to change the configuration) into the input box.
6. Click "Configure"

### Executing the application

Once you are in the sample application directory and you've configured the sample application to match your App Registration and registered Redirect URI, you can install all of the dependencies by running:

```bash
$ npm install
```

When the dependencies have been installed, you can run the sample application by using the following command, after which the Electron application should start.

```bash
$ npm start
```
