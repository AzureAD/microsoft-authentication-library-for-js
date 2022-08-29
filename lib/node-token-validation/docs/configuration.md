# Configuration 

Before you start here, make sure you understand how to [initialize the TokenValidator](./initialization.md).

## Using the config object

The configuration object has the following structure, and can be passed into the `TokenValidator` constructor. Everything is optional, but may be changed depending on your tenant and application model.

```javascript
const config = {
  auth: {
    authority: "https://login.microsoftonline.com/common", 
    protocolMode: nodeTokenValidation.ProtocolMode.OIDC,
    clockSkew: 0
  },
  system: {
    loggerOptions: {
      loggerCallback: (): void => {
          // allow users to not set logger call back
      },
      logLevel: LogLevel.Info,
      piiLoggingEnabled: false
    },
    networkClient: // Default Node Token Validation network client
  }
}
```

## Configuration Options

### Auth Config Options

| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `authority` | URI of the tenant to authenticate and authorize with. Usually takes the form of `https://{uri}/{tenantid}`. | String in URI format with tenant - `https://{uri}/{tenantid}` | `https://login.microsoftonline.com/common` |
| `protocolMode` | Enum representing the protocol mode to use. If `"AAD"`, will function on the OIDC-compliant AAD v2 endpoints; if `"OIDC"`, will function on other OIDC-compliant endpoints. | string | `"OIDC"` |
| `clockSkew` | Clock skew (in seconds) allowed in token validation. Must be a positive integer. | number | 0 |

### System Config Options

| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `loggerOptions` | Config object for logger. | See [below](#logger-config-options). | See [below](#logger-config-options). |
| `NetworkClient` | Custom HTTP implementation | INetworkModule | |

### Logger Config Options

| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `loggerCallback` | Callback function which handles the logging of MSAL statements. | Function - `loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void` | See example above. |
| `logLevel` | Enum representing the level of descriptions of logs | string | `"Info"`
| `piiLoggingEnabled` | If true, personally identifiable information (PII) is included in logs. | boolean | `false` |
