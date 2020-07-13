# Scopes and Resources

Azure Active Directory & Microsoft Identity Platform employs a *scope-centric* access model.

## Working with Multiple Resources

**Access Token** requests in MSAL.js are meant to be *per-resource* (such as [MS Graph API](https://docs.microsoft.com/graph/overview) or your own web API). This means that an **Access Token** requested for resource **A** cannot be used for accessing resource **B**. The intended recipient of an **Access Token** is represented by the `aud` claim; in case the value for the `aud` claim does not mach the resource **APP ID URI**, the token will be rejected. [See the documentation for further information](https://docs.microsoft.com/azure/active-directory/develop/access-tokens#payload-claims).

When you have to access multiple resources, initiate a separate token request for each:

```javascript
    const graphToken = await msalInstance.acquireTokenSilent({
         scopes: [ "User.Read" ]
    });

    const customApiToken = await msalInstance.acquireTokenSilent({
         scopes: [ "api://<myCustomApiClientId>/My.Scope" ]
    });
```

> Bear in mind that you *can* request multiple scopes for the same resource (e.g. `User.Read`, `User.Write` and `Calendar.Read` for MS Graph API).

In case you *erroneously* pass multiple resources in your token request, the token you will receive will only be issued for the first resource.

```javascript
    // you will only receive a token for MS GRAPH API's "User.Read" scope here
    const myToken = await msalInstance.acquireTokenSilent({
         scopes: [ "User.Read", "api://<myCustomApiClientId>/My.Scope" ]
    });
```

## Dynamic Scopes and Incremental Consent

### LoginRequest vs. TokenRequest

The difference is about at which stage the user will be asked for consent. Consider:

```javascript
     const loginRequest = {
          scopes: [ "openid", "profile", "User.Read" ]
     };

     const tokenRequest = {
          scopes: ["Mail.Read"]
     };

     msalInstance.loginPopup(loginRequest);
     // ...

     msalInstance.acquireTokenSilent(tokenRequest);
     // ...
```

In the code snippet above, the user will consent to `User.Read` scope once they authenticate. Later, if they request an **Access Token** for `User.Read`, they will not be asked for consent again (in other words, they can acquire a token *silently*). On the other hand, the user did not consented to `Mail.Read` at the authentication stage. As such, they will be asked for consent when requesting an **Access Token** for that scope.
