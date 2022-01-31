# Error Handling in MSAL node

MSAL.js provides classes to handle the different types of common errors.

These classes are as follows:

>`AuthError`: This is the base class for all errors, it also handles unexpected errors.

>`ClientAuthError`: This class indicates issues partaining client authentication.

>`ClientConfigurationError`: This error class is thrown before requests are made, when there is an issue with user configuration parameters.

>`ServerError`: This class represents errors sent by the authentication server.

Find out more about MSAL.js error handling [here ](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-error-handling-js).




## Tables

|Error class| Error code |Cause/error string |  How to handle |
|----------|-------------|-------------|------|
| `ClientAuthError` | <p>`endpoints_resolution_error`: Could not resolve endpoints. Please check network and try again </p><br/> <p>`openid_config_error`: Could not retreive endpoints. check your authority and verify the <br/>.well-known/openid-configuration endpoint returns the required endpoints</p><br/><p>`invalid_assertion`: Client assertion must meet requirements described in https://tools.ietf.org/html/rfc7515</p><br/><p>`request_cannot_be_made`: Token request cannot be made without authorization code or refresh token.</p><br/><p>`invalid_client_credential`: Client credential (secret, certificate, or assertion) must not be empty <br/>when creating a confidential client. An application should at most have one credential</p>| <p>This error is thrown when the wrong authority is provided</p><br/><p>This error is thrown when either the certificate thumbprint or public key is not provided </p><br/> <p>This error is thrown when credentials of a public app registration are used in a confidential client setting</p><br/>|p
| `ClientConfigurationError` | <p>`url_parse_error`: URL could not be parsed into appropriate segments.</p>|   This error is thrown when an invalid URL is provided as the authority | Ensure the authority provided is a valid URL
| `ServerError` |  |    These are errors returned from Azure Active Directory security token service (STS) | Learn more about AAD error codes here [Azure AD Authentication and authorization error codes.](https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes)





## 