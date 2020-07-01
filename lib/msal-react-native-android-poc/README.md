# MSAL React Native Proof of Concept (Android)
MSAL for React Native is a proof of concept that allows React Native applications to acquire access tokens from the Microsoft identity platform endpoint in order to access secured web APIs. Currently, this library is only available for the Android platform.
## Getting started

### Installation

`$ npm install @azuread/msal-react-native-android-poc@1.0.1`

### Register your application in the Azure Portal
Under Authentication -> Platform configurations, click "Add a platform" and select Android. 
To generate the base64 signature of your application:
* MacOS: keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
* Windows: keytool -exportcert -alias androiddebugkey -keystore %HOMEPATH%.android\debug.keystore | openssl sha1 -binary | openssl base64
For more information and help, refer to this [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ).

### Configuring in app
Follow steps 1 through 3 in the [Using MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-android#using-msal) section of MSAL for Android's README with these modifications/reminders:
* In step 2, please named the config file `auth_config_single_account.json` and put it in `res/raw`. You can pretty much copy and paste the MSAL configuration generated for you in Azure Portal.
* In step 3, remember that for `android:path` you want to paste the base64 signature hash you generated in the console and not the url encoded version.

## Usage
```javascript
import MSAL from '@azuread/msal-react-native-android-poc';

// TODO: What to do with the module?
MSAL;
```
