# CORS API usage in MSAL Angular v2

MSAL will get access tokens using a hidden Iframe for given CORS API endpoints in the config. To make CORS API call, you need to specify your CORS API endpoints as a map in the Angular config.

```js
export const protectedResourceMap: new Map([
    ['https://buildtodoservice.azurewebsites.net/api/todolist', [ 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user' ]],
    ['https://graph.microsoft.com/v1.0/me', ['user.read']]
]);

@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: { // MSAL Configuration
                clientId: 'Your client ID',
            }
        }, {
            interactionType: InteractionType.Redirect // MSAL Guard Configuration
        }, {
            interactionType: InteractionTYpe.Redirect // MSAL Interceptor Configuration
            protectedResourceMap : protectedResourceMap
        })
    ]
})
```

In your API project, you need to enable CORS API requests to receive flight requests.
