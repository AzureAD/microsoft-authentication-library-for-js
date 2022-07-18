# Initialization of Node Token Validation library

In this document:
- [Initializing the TokenValidator](#initializing-the-tokenvalidator)
  - [Configuration Basics](#configuration-basics)
- [Token Validation Parameters](#token-validation-parameters)

## Initializing the TokenValidator

In order to use the Node Token Validation library, you need to instantiate a `TokenValidator` object. The `TokenValidator` can be instantiated with optional configurations (see below).

```javascript
const nodeTokenValidation = require("@azure/node-token-validation");

const tokenValidator = new nodeTokenValidation.TokenValidator();
```

### Configuration Basics

Configurations for the `TokenValidator` are optional, and will be instantiated with defaults if not passed in. Details on configuration

See below for an example initialization and configuration:

```javascript
const nodeTokenValidation = require("@azure/node-token-validation");

const loggerOptions = {
    loggerCallback(loglevel, message, containsPii) {
        console.log(message);
    },
    logLevel: nodeTokenValidation.LogLevel.Verbose,
    piiLoggingEnabled: false
}

const config = {
  auth: {
    authority: "https://login.microsoftonline.com/common",
    protocolMode: nodeTokenValidation.ProtocolMode.AAD,
    clockSkew: 0
  },
  system: {
    loggerOptions: loggerOptions
  }
}

const tokenValidator = new nodeTokenValidation.TokenValidator(config);
```

## Token Validation Parameters

The token validation APIs decode and validate a JSON Web Token (JWT) as well as the JSON Web Signature (JWS).

The following OIDC-compliant claims on a JWT are validated:

| Claim Name | Claim            | Description |
| -----------| ---------        | ----------- |
| "iss"      | Issuer           | Principal that issued the JWT |
| "aud"      | Audience         | Recipient that the JWT is intended for |
| "sub"      | Subject          | Principal that is the subject of the JWT |
| "exp"      | Expiration Time  | Expiration time after which the JWT must not be accepted for processing |
| "nbf"      | Not before       | Time before which the JWT must not be accepted for processing |

These additional claims for an id token may be validated if set in the `TokenValidationParams`:

| Claim Name | Claim     | Description |
| -----------| --------- | ----------- |
| "nonce"    | Nonce     | Principal that issued the JWT |
| "c_hash"   | C_Hash    | C_hash on an id token is validated against the authorization code  |
| "at_hash"  | AT_Hash   | At_hash claim on an id token is validated against the access token |
