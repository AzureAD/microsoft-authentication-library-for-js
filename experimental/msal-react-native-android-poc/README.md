# MSAL React Native Proof of Concept (Android)
**Note: With this library being a proof of concept, it is not recommended to be used for React Native applications intended for production.**

MSAL for React Native is a proof of concept that allows React Native applications to authenticate users with Microsoft work and school accounts (AAD) as well as acquire access tokens from the Microsoft identity platform endpoint in order to access secured web APIs. Currently, this library is only available for the Android platform.
## Getting started

### Installation

`$ npm install @azuread/msal-react-native-android-poc`

### Register your application in the Azure Portal
Under Authentication -> Platform configurations, click "Add a platform" and select Android. 
To generate the base64 signature of your application:
* MacOS: `keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64`
* Windows: `keytool -exportcert -alias androiddebugkey -keystore %HOMEPATH%.android\debug.keystore | openssl sha1 -binary | openssl base64`

For more information and help, refer to this [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ).

### Configuring in app
Follow steps 1 through 3 in the [Using MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-android#using-msal) section of MSAL for Android's README with these modifications/reminders:
* In step 2, please name the config file `auth_config_single_account.json` and put it in `res/raw`. You can pretty much copy and paste the MSAL configuration generated for you in Azure Portal and refer to the [configuration file documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-configuration).
* In step 3, remember that for `android:path` you want to paste the base64 signature hash you generated in the console and not the url encoded version.

## Usage
Import MSAL for React Native as `MSAL`:
```javascript
import MSAL from '@azuread/msal-react-native-android-poc';
```
Importing will automatically create a `SingleAccountPublicClientApplication` with the configurations provided in `auth_config_single_account.json`.
All of the MSAL methods return a promise. 
You can use `MSAL` to sign in a user with [scopes](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#scopes-and-permissions) (a string of scopes separated by " "):
```javascript
try {
    await MSAL.signIn(scopesValue);
} catch (error) {
    console.log(error);
}
```
Most of the methods return a map, and in the case of `signIn`, a map containing the variables of an `IAccount` object is returned.
We can access the username of the currently signed in user and log it to console (for example):
```javascript
try 
    const account = await MSAL.signIn(scopesValue);
    console.log("Username: " + account.username)
} catch (error) {
    console.log(error);
}
```
Since a user is now signed in, we can try to acquire an access token silently and make a call to Microsoft Graph API:
```javascript
try {
    const result = await MSAL.acquireTokenSilent(scopesValue);
    //api call to MSGraph
    const response = await fetch (
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
Please see msal-react-native-android-poc-sample in the sample folder for an example app that demonstrates the MSAL methods.

For a complete listing of each method's return value and map keys, see the Methods(link to Methods) section.

## What to expect from this library
Because this library is a proof of concept, it is scoped to specific features and does not implement all the capabilities of an official MSAL for React Native library. 

This proof of concept is scoped to consider:
* Compatibility with the Android platform
* Authenticating users with work and school Azure AD accounts (AAD)
* Single-account mode

This proof of concept does not implement:
* Compatibility with iOS
    * To allow compatibility with iOS, an [Objective-C native module](https://reactnative.dev/docs/native-modules-ios) must be created that wraps the       [MSAL for iOS and macOS](https://github.com/AzureAD/microsoft-authentication-library-for-objc#:~:text=The%20MSAL%20library%20for%20iOS%20and%20macOS%20gives,for%20those%20using%20our%20hosted%20identity%20management%20service.).
* B2C or ADFS
    * For implementing B2C, refer to the Microsoft docs on using [MSAL for Android with B2C](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-android-b2c). Since the returned value from acquiring tokens is an [`IAuthenticationResult`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.identity.client.authenticationresult?view=azure-dotnet), the results of the wrapped B2C methods can be handled in the same manner as the existing AAD methods.
* Multiple-account mode
    * This could be as simple as adding an instance of [MultipleAccountPublicClientApplication](https://docs.microsoft.com/en-us/java/api/com.microsoft.identity.client.multipleaccountpublicclientapplication?view=azure-java-stable) to the existing native module file and      wrapping its corresponding methods.

## Methods
This library's methods wrap MSAL for Android's corresponding `singleAccountPublicClientApplication` methods. All methods return a promise that, in most cases, resolves to a map and returns an exception if rejected. Please see the Microsoft Docs for [`singleAccountPublicClientApplication`](https://docs.microsoft.com/en-us/java/api/com.microsoft.identity.client.singleaccountpublicclientapplication?view=azure-java-stable) for more general information regarding MSAL methods.
Method                                 | Description |
-------------------------------------- | ----------- |
signIn(String scopesValue)             | Directs a user to sign in with an AAD account. scopesValue is a String containing scopes separated by spaces (" "). Returns a map with the `authority`, `id`, `tenantId`, `username`, and `idToken` of the account. See the Microsoft docs on [IAccount](https://docs.microsoft.com/en-us/java/api/com.microsoft.identity.client.iaccount?view=azure-java-stable) for more details of the map's keys. |
signOut()                              | Signs out the account currently signed in. If successful, `true` is returned, and if not, an exception is returned. |
getAccount()                           | Retrieves the account currently signed in. If no account is signed in, null is returned. Otherwise, a map is returned with the `authority`, `id`, `tenantId`, `username`, and `idToken` of the account. See the Microsoft docs on [IAccount](https://docs.microsoft.com/en-us/java/api/com.microsoft.identity.client.iaccount?view=azure-java-stable) for more details of the map's keys. |
isSharedDevice()                       | Returns a boolean that corresponds to whether the current device is shared or not. |
acquireToken(String scopesValue)       | Attempts to obtain an access token interactively. scopesValue is a String containing scopes separated by spaces (" "). Returns a map containing `accessToken`, `authenticationScheme`, `authorizationHeader`, `expiresOn` (string), `scope` (string), `tenantId`, and `account` (map with keys as described in "signIn"). An exception is returned otherwise. See MS docs on [IAuthenticationResult](https://docs.microsoft.com/en-us/java/api/com.microsoft.identity.client.iauthenticationresult?view=azure-java-stable) for more details. |
acquireTokenSilent(String scopesValue) | Attempts to obtain a token silently. scopesValue is a String containing scopes separated by spaces (" "). Returns a map containing `accessToken`, `authenticationScheme`, `authorizationHeader`, `expiresOn` (string), `scope` (string), `tenantId`, and `account` (map with keys as described in "signIn"). An exception is returned otherwise. See MS docs on [IAuthenticationResult](https://docs.microsoft.com/en-us/java/api/com.microsoft.identity.client.iauthenticationresult?view=azure-java-stable) for more details. |
