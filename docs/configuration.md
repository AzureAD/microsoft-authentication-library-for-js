# Configuration Options

Before you start here, make sure you understand how to [initialize an app object](./initialization.md).

The MSAL library has a set of configuration options that can be used to customize the behavior of your authentication flows. These options can be set either in the constructor of the `PublicClientApplication` object or as part of the [request APIs](./request-response-object.md). Here we describe the configuration object that can be passed into the `PublicClientApplication` constructor. 

## Using the config object

The configuration object has the following structure, and can be passed into the `PublicClientApplication` constructor. The only required config parameter is the client ID of the application. Everything else is optional, but may be required depending on your tenant and application model.

```javascript
const msalConfig = {
    auth: {
        clientId: "enter_client_id_here",
        authority: "https://login.microsoftonline.com/common",
        knownAuthorities: [],
        cloudDiscoveryMetdata: "",
        redirectUri: "enter_redirect_uri_here",
        postLogoutRedirectUri: "enter_postlogout_uri_here",
        navigateToLoginRequestUrl: true
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
            piiLoggingEnabled: false
        },
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0
    };
}

const msalInstance = new PublicClientApplication(msalConfig);
```

## Configuration Options

### Auth Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `clientId` | App ID of your application. Can be found in your [portal registration](../README#prerequisites). | UUID/GUID | None. This parameter is required in order for MSAL to perform any actions. |
| `authority` | URI of the tenant to authenticate and authorize with. Usually takes the form of `https://{uri}/{tenantid}`. | String in URI format with tenant - `https://{uri}/{tenantid}` | `https://login.microsoftonline.com/common` |
| `knownAuthorities` | An array of URIs that are known to be valid. Used in B2C scenarios. | Array of strings in URI format | Empty array `[]` |
| `cloudDiscoveryMetadata` | A string containing the cloud discovery response. Used in AAD scenarios. See performance.md for more info | string | Empty string `""` |
| `redirectUri` | URI where the authorization code response is sent back to. Whatever location is specified here must have the MSAL library available to handle the response. | String in URI format | Login request page (`window.location.href` of page which made auth request) |
| `postLogoutRedirectUri` | URI that is redirected to after a logout() call is made. | String in URI format | Login request page (`window.location.href` of page which made auth request) |
| `navigateToLoginRequestUrl` | If `true`, will navigate back to the original request location before processing the authorization code response. If the `redirectUri` is the same as the original request location, this flag should be set to false. | boolean | `true` |

### Cache Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `cacheLocation` | Location of token cache in browser. | String value that must be one of the following: `"sessionStorage"`, `"localStorage"` | `sessionStorage` |
| `storeAuthStateInCookie` | If true, stores cache items in cookies as well as browser cache. Should be set to true for use cases using IE. | boolean | `false` |

### System Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `loggerOptions` | Config object for logger. | See [below](#logger-config-options). | See [below](#logger-config-options). |
| `windowHashTimeout` | Timeout in milliseconds to wait for popup authentication to resolve. | integer (milliseconds) | `60000` |
| `iframeHashTimeout` | Timeout in milliseconds to wait for iframe authentication to resolve | integer (milliseconds) | `6000` |
| `loadFrameTimeout` | Timeout in milliseconds to wait for the iframe to load in the window. | integer (milliseconds) | In IE or Edge: `500`, in all other browsers: `0` |

### Logger Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `loggerCallback` | Callback function which handles the logging of MSAL statements. | Function - `loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void` | See [above](#using-the-config-object). |
| `piiLoggingEnabled` | If true, personally identifiable information (PII) is included in logs. | boolean | `false` |
