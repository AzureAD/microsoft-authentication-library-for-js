# Request and Response Objects

## Request

### Scopes

When you login a user, you can pass in scopes that the user can pre-consent to on login. However, this is not required. Please note that consenting to scopes on login, does not return an access_token for these scopes, but gives you the opportunity to obtain a token silently with these scopes passed in, with no further interaction from the user.

In our examples, we use the MS Graph scopes `user.read` and `mail.read`, so your scopes may look a little different.

It is best practice to only request scopes you need when you need them, a concept called dynamic consent. While this can create more interactive consent for users in your application, it also reduces drop-off from users that may be uneasy granting a large list of permissions for features they are not yet using.

AAD will only allow you to get consent for 3 resources at a time, although you can request many scopes within a resource.
When the user makes a login request, you can pass in multiple resources and their corresponding scopes because AAD issues an idToken pre consenting those scopes. However acquireToken calls are valid only for one resource / multiple scopes. If you need to access multiple resources, please make separate acquireToken calls per resource.

You can read more about scopes and permissions [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent).
