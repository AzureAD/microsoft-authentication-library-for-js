# MSAL React Native Proof of Concept (Android)
MSAL for React Native is a proof of concept that allows React Native applications to acquire access tokens from the Microsoft identity platform endpoint in order to access secured web APIs. Currently, this library is only available for the Android platform.
## Getting started

### Installation

`$ npm install @azuread/msal-react-native-android-poc@1.0.1`

### Register your application in the Azure Portal
Under Authentication -> Platform configurations, click "Add a platform" and select Android. 
To generate the base64 signature of your application:
* MacOS: `keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64`
* Windows: `keytool -exportcert -alias androiddebugkey -keystore %HOMEPATH%.android\debug.keystore | openssl sha1 -binary | openssl base64`

For more information and help, refer to this [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ).

### Configuring in app
Follow steps 1 through 3 in the [Using MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-android#using-msal) section of MSAL for Android's README with these modifications/reminders:
* In step 2, please named the config file `auth_config_single_account.json` and put it in `res/raw`. You can pretty much copy and paste the MSAL configuration generated for you in Azure Portal and refer to the [configuration file documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-configuration).
* In step 3, remember that for `android:path` you want to paste the base64 signature hash you generated in the console and not the url encoded version.

## Usage
Import MSAL for React Native as `MSAL` like this:
```javascript
import MSAL from '@azuread/msal-react-native-android-poc';
```
Importing will automatically create a `SingleAccountPublicClientApplication` with the configurations provided in `auth_config_single_account.json`.
All of the MSAL functions return a promise. 
You can use `MSAL` to sign in a user with [scopes](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#scopes-and-permissions) (a string of scopes separated by " "):
```javascript
try {
    await MSAL.signIn(scopesValue);
} catch (error) {
    console.log(error);
}
```
Most of the functions return a map, and in the case of `signIn`, a map containing the variables of an `IAccount` object is returned.
We can access the username of the currently signed in user and log it to console (for example) like so:
```javascript
try {
    var account = await MSAL.signIn(scopesValue);
    console.log("Username: " + account.username)
} catch (error) {
    console.log(error);
}
```
Since a user is now signed in, we can try to acquire an access token silently and make a call to Microsoft Graph API:
```javascript
try {
    var result = await MSAL.acquireTokenSilent(scopesValue);
    //api call to MSGraph
    var response = await fetch (
        "https://graph.microsoft.com/v1.0/me", {
             method: 'GET',
             headers: {
                Authorization: `Bearer ${result.accessToken}`
             }
        }
    );
    
    ... //do something with response here
    
} catch (error) {
  console.log(error);
}
```
Please see msal-react-native-android-poc-sample in the sample folder for an example app that demonstrates the functions.

For a complete listing of each function's return value and map entries, if applicable, see the Functions(put link here) section.
