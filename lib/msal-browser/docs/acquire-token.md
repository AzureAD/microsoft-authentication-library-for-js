# Acquiring and Using an Access Token

> :information_source: Before you start here, make sure you understand how to [initialize the application object](./initialization.md). It is also crucial to understand the relationship between [access tokens and resources](./resources-and-scopes.md).

In MSAL, you can get access tokens for the APIs your app needs to call using the `acquireToken*` methods provided by the library. The `acquireToken*` methods abstract away the 2 steps involved in acquiring tokens with the [OAuth 2.0 authorization code flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow):

1. make a request to Azure AD to obtain an `authorization code`
1. exchange that code for an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) containing the user consented scopes

You can read more about access tokens [here](https://docs.microsoft.com/azure/active-directory/develop/access-tokens).

## Acquiring an Access Token

### Choose an Interaction Type

See [here](./initialization.md#choosing-an-interaction-type) if you are uncertain about the differences between `acquireTokenRedirect` and `acquireTokenPopup`.

### Prepare the request object

You must pass a request object to the `acquireToken*` APIs. This object allows you to use different parameters in the request. See [here](./request-response-object.md) for more information on the request object parameters. Scopes are required for all `acquireToken*` calls.

### Check the cache

MSAL uses a [cache](./caching.md) to store tokens based on specific parameters including scopes, resource and authority, and will retrieve the token from the cache when needed. It also can perform silent renewal of those tokens when they have expired. MSAL exposes this functionality through the `acquireTokenSilent` method.

After you've logged in with one of the `ssoSilent` or `login*` APIs the cache will contain a set of id, access and refresh tokens. Every time you need an access token you should call `acquireTokenSilent` and if this fails call an interactive API instead. `acquireTokenSilent` will look for a valid token in the cache, and if it is close to expiring or does not exist, will automatically try to refresh it for you using the cached refresh token. You can read more about using `acquireTokenSilent` [here](./token-lifetimes.md#token-renewal).

#### Popup

```javascript
var request = {
    scopes: ["User.Read"],
};

msalInstance.acquireTokenSilent(request).then(tokenResponse => {
    // Do something with the tokenResponse
}).catch(async (error) => {
    if (error instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        return msalInstance.acquireTokenPopup(request);
    }

    // handle other errors
})
```

#### Redirect

```javascript
var request = {
    scopes: ["User.Read"],
};

msalInstance.acquireTokenSilent(request).then(tokenResponse => {
    // Do something with the tokenResponse
}).catch(error => {
    if (error instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        return msalInstance.acquireTokenRedirect(request)
    }

    // handle other errors
});
```

## Using the Access Token

Once you have retrieved the access token, you must include it in the `Authorization` header as a [bearer token](https://www.rfc-editor.org/rfc/rfc6750) for the request to the resource you obtained the token for, as shown below:

```JavaScript
var headers = new Headers();
var bearer = "Bearer " + tokenResponse.accessToken;
headers.append("Authorization", bearer);
var options = {
        method: "GET",
        headers: headers
};
var graphEndpoint = "https://graph.microsoft.com/v1.0/me";

fetch(graphEndpoint, options)
    .then(resp => {
        //do something with response
    });
```

## MSAL token acquisition best practices

The following are best practices to acquire tokens with MSAL for avoiding errors, performance hits and usability issues. Certain scenarios may provide exceptions to these.

### Use a single PublicClientApplication instance

Instantiate one `PublicClientApplication` per application and use the same instance throughout your app. This ensures that there is a single source of truth for what MSAL is performing at any given time (see: [MSAL events](events.md)) and eliminates the chance of distinct app objects making parallel interactive requests or potential cache conflicts, which might break apps, reduce performance or hinder user experience.

### Always wait for promises to resolve

All MSAL `acquireToken*` as well as `login*` APIs perform asynchronous operations and return promises. You should always wait for these promises to resolve, even if you do not need the promise payload.

### Attempt silent request first, then interactive

When requesting tokens, always use `acquireTokenSilent` first, falling back to interactive token acquisition if needed (e.g., when the `InteractionRequiredAuthError` is thrown).

Concurrent silent requests are permitted. If two or more silent requests are made at the same time, only one would go to the network (if needed), but all would receive the response, as long as those requests are for the same request parameters (e.g. scopes).

Concurrent interactive requests are **not** permitted. If two or more silent requests are made at the same time, only the first one will start an interaction, while the rest will fail with [interaction_in_progress](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md#interaction_in_progress) error.

> **Avoiding *interaction_in_progress* errors**
>
> In most circumstances, you can avoid *interaction_in_progress* errors by refactoring your code to prevent interactive requests from being triggered concurrently. If you are working on an Angular or React application, MSAL Angular and MSAL React offers observables and hooks, respectively, that you can use for this. To learn more, please refer to:
>
> - [msal-angular interaction_in_progress error](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md#interaction_in_progress)
>- [msal-react interaction_in_progress error](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/errors.md#interaction_in_progress)
>
> In general, your token acquisition method should check if any other interaction is in progress prior to invoking an interaction. If you are not using wrapper libraries, you can achieve this via a global application state or a broadcast service etc. that emits the current MSAL interaction status via [MSAL Events API](./events.md). See for instance: [custom MsalPlugin in a Vue.js application](../../../samples/msal-browser-samples/vue3-sample-app/src/plugins/msalPlugin.ts).
>
> The snippet below illustrates one possible approach to avoid *interaction_in_progress* errors:
>
> ```typescript
> async function myAcquireToken(request: PopupRequest): Promise<AuthenticationResult> {
>    const msalInstance = getMsalInstance(); // get the msal application instance
>
>    const tokenRequest = {
>        account: msalInstance.getActiveAccount() || null;
>        ...request
>    };
>
>    let tokenResponse;
>
>    try {
>        // attempt silent acquisition first
>        tokenResponse = await msalInstance.acquireTokenSilent(request);
>    } catch (error) {
>        if (error instanceof InteractionRequiredAuthError) {
>            try {
>                // myWaitFor is a method that polls the interaction status and resolves when "None"
>                await myWaitFor(() => myGlobalState.getInteractionStatus() === InteractionStatus.None);
>
>                // wait is over
>                tokenResponse = await msalInstance.acquireTokenPopup(request);
>            } catch (err) {
>                console.log(err);
>                // handle other errors
>            }
>        }
>
>        console.log(error);
>        // handle other errors
>    }
>
>    return tokenResponse;
> }
> ```

### Make one token request per resource

You can only request access tokens for one resource at a time (see [resources and scopes](resources-and-scopes.md)). If needed, you can ask user consent to scopes (permissions) required by more than one resource by using the `extraScopesToConsent` parameter in the request object. Access tokens for previously consented scopes can be acquired silently.

## Next Steps

- [Token lifetimes, expiration and renewal](./token-lifetimes.md).
- [Caching in MSAL](./caching.md)
- [Handling errors](./errors.md)
- [Working with B2C](./working-with-b2c.md)
- [Throttling](../../msal-common/docs/Throttling.md)
