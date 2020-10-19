# Configuration Options

Before you start here, make sure you understand how to [initialize an app object](./Initialize-PublicClientApplication.md).

The MSAL library has a set of configuration options that can be used to customize the behavior of your authentication flows. These options can be set either in the constructor of the `PublicClientApplication` object or as part of the [request APIs](./Request.md). Here we describe the configuration object that can be passed into the `PublicClientApplication` constructor.

In this document:
- [Usage](#usage)
- [Options](#options)

## Usage

The configuration object can be passed into the `PublicClientApplication` constructor. The only required config parameter is the `client_id` of the application. Everything else is optional, but may be required depending on your authentication flow, tenant and application model.

[Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/modules/_src_config_configuration_.html#configuration) object with all supported parameters is as below:

```javascript

// Call back APIs which automatically write and read into a .json file - example implementation
const beforeCacheAccess = async (cacheContext) => {
    cacheContext.tokenCache.deserialize(await fs.readFile(cachePath, "utf-8"));
};

const afterCacheAccess = async (cacheContext) => {
    if(cacheContext.cacheHasChanged){
        await fs.writeFile(cachePath, cacheContext.tokenCache.serialize());
    }
};

// Cache Plugin
const cachePlugin = {
    beforeCacheAccess,
    afterCacheAccess
};;

const msalConfig = {
    auth: {
        clientId: "enter_client_id_here",
        authority: "https://login.microsoftonline.com/common",
        knownAuthorities: [],
        cloudDiscoveryMetadata: "",
    },
    cache: {
        cachePlugin // your implementation of cache plugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
}

const msalInstance = new PublicClientApplication(msalConfig);
```

## Options

### Auth Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `clientId` | App ID of your application. Can be found in your [portal registration](../README#prerequisites). | UUID/GUID | None. This parameter is required in order for MSAL to perform any actions. |
| `authority` | URI of the tenant to authenticate and authorize with. Usually takes the form of `https://{uri}/{tenantid}`. | String in URI format with tenant - `https://{uri}/{tenantid}` | `https://login.microsoftonline.com/common` |
| `knownAuthorities` | An array of URIs that are known to be valid. Used in B2C scenarios. | Array of strings in URI format | Empty array `[]` |
| `cloudDiscoveryMetadata` | A string containing the cloud discovery response. Used in AAD scenarios. See performance.md for more info | string | Empty string `""` |
| `protocolMode` | Enum representing the protocol mode to use. If `"AAD"`, will function on the AAD v2 endpoints; if `"OIDC"`, will function on OIDC-compliant endpoints. | string | `"AAD"` |

### Cache Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `cachePlugin` | Cache plugin with call backs to reading and writing into the cache file| [ICachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/interfaces/_src_cache_icacheplugin_.icacheplugin.html) | null

### System Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `loggerOptions` | Config object for logger. | See [below](#logger-config-options). | See [below](#logger-config-options). |
| `NetworkClient` | Custom HTTP implementation | INetworkModule | Coming Soon |

### Logger Config Options
| Option | Description | Format | Default Value |
| ------ | ----------- | ------ | ------------- |
| `loggerCallback` | Callback function which handles the logging of MSAL statements. | Function - `loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void` | See [above](#using-the-config-object). |
| `piiLoggingEnabled` | If true, personally identifiable information (PII) is included in logs. | boolean | `false` |

## Next Steps
Proceed to understand the public APIs provided by `msal-node` for acquiring tokens [here](../../msal-common/docs/request.md)
