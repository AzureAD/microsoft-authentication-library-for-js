# Migrate applications to the Microsoft Authentication Library (MSAL) for Node.js

Many developers have built and deployed applications using the Azure Active Directory Authentication Library (ADAL). We now recommend using the Microsoft Authentication Library (MSAL) for authentication and authorization of Azure AD entities.

By using MSAL instead of ADAL:

- You can authenticate a broader set of identities:
    - Azure AD identities
    - Microsoft accounts
    - Social and local accounts by using Azure AD B2C
- Your users will get the best single-sign-on experience.
- Your application can enable incremental consent.
- Supporting Conditional Access is easier.
- You benefit from innovation. Because all Microsoft development efforts are now focused on MSAL, no new features will be implemented in ADAL.

MSAL is now the recommended authentication library for use with the Microsoft identity platform.

## Frequently asked questions (FAQ)

**Q: Is ADAL being deprecated?**

A: Yes. Starting June 30th, 2020, we will no longer add new features to ADAL. We'll continue adding critical security fixes to ADAL until June 30th, 2022. After this date, your apps using ADAL will continue to work, but we recommend upgrading to MSAL to take advantage of the latest features and to stay secure.

**Q: Will my existing ADAL apps stop working?**

A: No. Your existing apps will continue working without modification. If you're planning to keep them beyond June 30th, 2022, you should consider updating your apps to MSAL to keep them secure, but migrating to MSAL isn't required to maintain existing functionality.

**Q: How do I know which of my apps are using ADAL?**

A: If you have the source code for the application, you can reference the migration guides below to help determine which library the app uses and how to migrate it to MSAL. If you partnered with an ISV, we suggest you reach out to them directly to understand their migration journey to MSAL.

**Q: Why should I invest in moving to MSAL?**

A: MSAL contains new features not in ADAL including incremental consent, single sign-on, and token cache management. Also, unlike ADAL, MSAL will continue to receive security patches beyond June 30th, 2022. Learn more.

**Q: Will Microsoft update its own apps to MSAL?**

Yes. Microsoft is in the process of migrating its applications to MSAL by the end-of-support deadline, ensuring they'll benefit from MSAL's ongoing security and feature improvements.

**Q: Will you release a tool that helps me move my apps from ADAL to MSAL?**

A: No. Differences between the libraries would require dedicating resources to development and maintenance of the tool that would otherwise be spent improving MSAL. However, we do provide the set of migration guides below to help you make the required changes in your application.

**Q: How does MSAL work with AD FS?**

A: MSAL for Node.js supports certain scenarios to authenticate against AD FS 2019. If your app needs to acquire tokens directly from earlier version of AD FS, you should remain on ADAL. Learn more.

**Q: How do I get help migrating my application?**

A: See the Migration guidance section of this article. If, after reading the guide for your app's platform, you have additional questions, you can post on Microsoft Q&A with the tag [azure-ad-adal-deprecation] or open an issue in library's GitHub repository. See the Languages and frameworks section of the MSAL overview article for links to each library's repo.

## Differences between MSAL and ADAL for node.js
Both the Microsoft Authentication Library for Node.js (MSAL for Node.js) and Azure AD Authentication Library for Node.js (ADAL for Node.js) are used to authenticate Azure AD entities and request tokens from Azure AD. Up until now, most developers have worked with Azure AD for developers (v1.0) to authenticate Azure AD identities (work and school accounts) by requesting tokens using ADAL. Now, using MSAL for Node.js, you can authenticate a broader set of Microsoft identities (Azure AD identities and Microsoft accounts, and social and local accounts through Azure AD B2C) through the Microsoft identity platform.

This section describes outlines the differnces between the Microsoft Authentication Library for Node.js (MSAL for Node.js) and Azure AD Authentication Library for Node.js (ADAL for Node.js).

### Difference in the Core API
- The methods to acquire tokens using the device code flow have been merged into `acquireTokenByDeviceCode` from the `acquireUserCode`, `acquireTokenWithDeviceCode` and `acquireToken` used to acquire a token via device code in MSAL.

- The use of a certificate as a credential to acquire a token has been moved from the `acquireTokenWithClientCertificate` and has been included in as one of the modes of authentication in the `ConfidentialApplication` user agent client application.

- The method to acquire and renew tokens silently without prompting users is named `acquireToken` in ADAL.js. In MSAL.js, this method is named `acquireTokenSilent` to be more descriptive of this functionality.

Below is a table of other renamed libraries and how they match up to their equivalent MSAL methods:

| ADAL | MSAL |
| ---- | ---- |
|  acquireTokenWithClientCredentials |  acquireTokenByClientCredentials |
| acquireTokenWithRefreshToken| acquireTokenByRefreshToken|
| acquireTokenWithUsernamePassword| acquireTokenByUsernamePassword|

### Authority value `common`
In v1.0, using the https://login.microsoftonline.com/common authority will allow users to sign in with any Azure AD account (for any organization).

In v2.0, using the https://login.microsoftonline.com/common authority, will allow users to sign in with any Azure AD organization account or a Microsoft personal account (MSA). To restrict the sign in to only Azure AD accounts (same behavior as with ADAL), use https://login.microsoftonline.com/organizations. For details, see the configure authority option in [Initialization of MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md#initialization-of-msal).

### Scopes of acquiring tokens
- Scope instead of resource parameter in authentication requests to acquire tokens

  v2.0 protocol uses scopes instead of resource in the requests. In other words, when your application needs to request tokens with permissions for a resource such as MS Graph, the difference in values passed to the library methods is as follows:

  v1.0: resource = https://graph.microsoft.com

  v2.0: scope = https://graph.microsoft.com/User.Read

  You can request scopes for any resource API using the URI of the API in this format: appidURI/scope For example: https://mytenant.onmicrosoft.com/myapi/api.read

  Only for the MS Graph API, a scope value user.read maps to https://graph.microsoft.com/User.Read and can be used interchangeably.

  ```js
  const cca = new msal.ConfidentialClientApplication(config);

  const request = {
    scopes: ["User.Read"];
  };

  cca.acquireTokenByClientCredential(request)
  ```
- Dynamic scopes for incremental consent.

  When building applications using v1.0, you needed to register the full set of permissions(static scopes) required by the application for the user to consent to at the time of login. In v2.0, you can use the scope parameter to request the permissions at the time you want them. These are called dynamic scopes. This allows the user to provide incremental consent to scopes. So if at the beginning you just want the user to sign in to your application and you don’t need any kind of access, you can do so. If later you need the ability to read the calendar of the user, you can then request the calendar scope in the acquireToken methods and get the user's consent. For example: 

  ```js
  const cca = new msal.ConfidentialClientApplication(config);

  const request = {
    scopes: ["https://graph.microsoft.com/User.Read", "https://graph.microsoft.com/Calendar.Read"];
  };

  cca.acquireTokenByClientCredential(request)
  ```
- Scopes for V1.0 APIs

  When getting tokens for V1.0 APIs using MSAL.js, you can request all the static scopes registered on the API by appending .default to the App ID URI of the API as scope. For example:

  ```js
  const cca = new msal.ConfidentialClientApplication(config);

  const request = {
    scopes: [apidURI + "/.default"];
  };

  cca.acquireTokenByClientCredential(request)
  ```
### Migrating from the AuthenticationContext to PublicClientApplication or ConfidentialClientApplication

#### Constructing PublicClientApplication or ConfidentialClientAppliation
When you use MSAL, you instantiate either a [PublicClientApplication](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md) or a [ConfidentialClientApplication](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-confidential-client-application.md). This object models your app identity and is used to make your requests through whichever flow you want. With this object you will configure your client idenitity, redirect URI, default authority, the log level and more.

You can [declaratively configure](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md) this object with JSON.

#### Migrate from authority validation to known authorities

ADAL has a flag to enable or disable authority validation.  Authority validation is a feature in ADAL/MSAL, that prevents your code from requesting tokens from a potentially malicious authority. ADAL retrieves a list of authorities known to Microsoft and validates the user provided authority against the retrieved set of authorities. Use of the flag is shown in the code snippet below.

```js
// With this flag you can turn on and off the authority validation
// NOTE: The flag defaults to true
var validateAuthority = true;

var context = new AuthenticationContext(authorityUrl, validateAuthority);

context.acquireTokenWithClientCredentials(resource, clientId, clientSecret, function(err, tokenResponse) {
  if (err) {
    console.log('well that didn\'t work: ' + err.stack);
  } else {
    console.log(tokenResponse);
  }
});
```

MSAL does not have a flag to disable authority validation, authorities are always validated. MSAL now compares your requested authority against a list of authorities known to Microsoft or a list of authorities you've specified in your configuration. Like illustrated in the code snippet below.

```js
// A user can include a list of know authorities to the config object to be used
// during authority validation, as shown below.
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.live.com',
        knownAuthorities: ["login.live.com"],
        protocolMode: "OIDC"
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(msalConfig)
```

#### Logging
To configure how MSAL logs it's activity you can specify the log level, callback and more in the configuration object passed during application instantiation as explained [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md)