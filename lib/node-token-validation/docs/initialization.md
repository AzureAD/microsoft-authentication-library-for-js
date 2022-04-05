# Initialization of Node Token Validation library

In this document:
- [Initializing the TokenValidator](#initializing-the-tokenvalidator)
  - [Configuration Basics](#configuration-basics)
  - [Advanced Configuration](#advanced-configuration)
- [Next Steps](#next-steps)

## Initializing the TokenValidator

In order to use the Node Token Validation library, you need to instantiate a `TokenValidator` object. The `TokenValidator` can be instantiated with optional configurations (see below).

```javascript
const nodeTokenValidation = require("@azure/node-token-validation");

const tokenValidator = new nodeTokenValidation.TokenValidator();
```

### Configuration Basics

Configurations for the `TokenValidator` are optional, and will be instantiated with defaults if not passed in. 

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

### Advanced Configuration
More configuration options are documented [here](./configuration.md).

## Next steps

Proceed to understand the public APIs provided by the Node Token Validation library [here](../docs/public-apis.md).