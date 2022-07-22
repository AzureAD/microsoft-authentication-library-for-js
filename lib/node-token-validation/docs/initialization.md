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

Configurations for the `TokenValidator` are optional, and will be instantiated with defaults if not passed in. See below for an example initialization and configuration:

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

### Passing in Token Validation Parameters

The following options can be passed in as `TokenValidationParams`:

| Parameter             | Corresponding claim | Description   |
| ----------------------|---------------------|---------------|
| validIssuers          | "iss"               | Array of valid issuers |
| validAudiences        | "aud"               | Array of valid audiences |
| subject               | "sub"               | Valid subject |
| nonce                 | "nonce"             | Valid nonce |
| code                  | "c_hash"            | Authorization code to compare to c_hash |
| accessTokenForHash    | "at_hash"           | Access token to compare to at_hash |
| validAlgorithms       | -                   | Valid algorithms |
| issuerSigningKeys     | -                   | Keys for decoding and validating JSON Web Signature |
| issuerSigningJwksUri  | -                   | Jwks_uri for retrieving signing keys
| validTypes            |                     | Valid types
| requireExpirationTime |                     | Boolean for whether to check expiration value |
| requireSignedTokens   |                     | Boolean for whether tokens must be signed |

The `TokenValidationParams` can be passed into the token validation API as follows. More complex usage can be found in our [samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples).

```javascript
const nodeTokenValidation = require("@azure/node-token-validation")

const loggerOptions = {
    loggerCallback(loglevel, message, containsPii) {
        console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: nodeTokenValidation.LogLevel.Verbose,
}

const config = {
    auth: {
        authority: "https://login.microsoftonline.com/common/",
    },
    system: {
        loggerOptions: loggerOptions
    } 
};

app.get("/", (req, res) => {
    const tokenValidator = new nodeTokenValidation.TokenValidator(config);

    const token = "token-here";
    const tokenValidationParams = {
        validIssuers: ["issuer-here"],
        validAudiences: ["audience-here"]
    };

    tokenValidator.validateToken(token, tokenValidationParams).then((response) => {
        // Use token validation response
    }).catch((error) => {
        // Handle token validation error
    });

```
