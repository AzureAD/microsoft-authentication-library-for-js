
# Error Handling in MSAL.js

To make error handling simpler and more flexible, MSAL.js 1.x introduces `AuthError` objects that abstract and classify the different types of errors and provide an interface for specific details of the errors such as error messages to handle them appropriately.

## Error object

```javascript                                
export class AuthError extends Error {
    // This is a short code describing the error
    errorCode: string;
    // This is a descriptive string of the error,
    // and may also contain the mitigation strategy
    errorMessage: string;
    // Name of the error class
    this.name = "AuthError";
}
```                
By extending the error class, you have access to the following properties:
* `AuthError.message` - This is the same as errorMessage.
* `AuthError.stack` - Stack trace for thrown errors. Allows tracing to origin point of error.

## Error Types

The following error types are available:

* `AuthError`: Base error class for the MSAL.js library, also used for unexpected errors.

* `ClientAuthError`: Error class which denotes an issue with Client Authentication. Most errors that come from the library will be ClientAuthErrors. These may be errors such as calling login when login is in progress, users cancelling login, etc.

* `ClientConfigurationError`: Error class extending ClientAuthError thrown before requests are made when the given user config parameters is malformed or missing.

* `ServerError`: Error class to represent the error strings sent by the authentication server. These may be errors such as invalid request formats or parameters, or any other errors that prevent the server from authenticating or authorizing the user.

* `InteractionRequiredAuthError`: Error class extending ServerError to represent server errors which require an interactive call. This is thrown by `acquireTokenSilent` if the user is required to interact with the server to provide credentials or consent for authentication/authorization. Error codes include "interaction_required", "login_required", "consent_required".

For simpler error handling in authentication flows with redirect methods (loginRedirect, acquireTokenRedirect), MSAL.js 1.0.0 allows you to register a callback to be called after the redirect. As shown in configuration, you will need to explicitly register this callback through the `handleRedirectCallback()` method.

The popup methods (loginPopup, acquireTokenPopup) return promises, so you can use the promise pattern (.then and .catch) to handle them.

## Example usage:

```javascript
// Request for Access Token
myMSALObj.acquireTokenSilent(accessTokenRequest).then(function (accessTokenResponse) {
    // call API
}).catch( function (error) {
    // call acquireTokenPopup in case of acquireTokenSilent failure
    // due to consent or interaction required
    if (error.name === "InteractionRequiredAuthError") {
        myMSALObj.acquireTokenPopup(accessTokenRequest).then(
            function (accessTokenResponse) {
                // call API
            }).catch(function (error) {
                console.log(error);
            });
    }
});
```
