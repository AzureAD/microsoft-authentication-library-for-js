# Multi-Tenant

By default, there is multi-tenant support for your application since MSAL sets the tenant in the authority to 'common' if it is not specified in the config. This allows any Microsoft account to authenticate to your application. If you are not interested in multi-tenant behavior, you will need to set the `authority` config property when instantiating MSAL in the `app.module.ts` as shown below.

```js
@NgModule({
  imports: [
    MsalModule.forRoot({ // MSAL Configuration
      auth: {
        clientId: 'CLIENT_ID_HERE',
        authority: 'https://login.microsoftonline.com/TENANT_ID_HERE',
        redirectUri: 'http://localhost:4200',
        postLogoutRedirectUri: 'http://localhost:4200'
      },
      // Additional configuration here
    });
  ]
})
export class AppModule {}
```

If you allow multi-tenant authentication, and you do not wish to allow all Microsoft account users to use your application, you must provide your own method of filtering the token issuers to only those tenants who are allowed to login.

## Changing the tenant
The tenant can also be set dynamically by instantiating a new instance of MSAL in the relevant component, as shown below.

```js
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

@Component({})
export class AppComponent implements OnInit {
  constructor(
    private authService: MsalService
  ) {}

  ngOnInit(): void {
    this.authService.instance = new PublicClientApplication({
      auth: {
        clientId: 'CLIENT_ID_HERE',
        authority: 'https://login.microsoftonline.com/TENANT_ID_HERE',
        redirectUri: 'http://localhost:4200',
        postLogoutRedirectUri: 'http://localhost:4200'
      }
    });
  }
```

## Dynamic auth request

By default the MsalGuard and the MsalInterceptor use the static properties set in the config. Both can also be configured with a method for the `authRequest`, allowing the parameters used for authentication to be changed dynamically.

### MsalInterceptor - dynamic auth request (multi tenant tokens)

If `organizations` or `common` is used as the tenant, all tokens will be requested for the users' home tenant. However, this may not be the desired outcome. If a user is invited as a guest, the tokens may be from the wrong authority.

Setting the `authRequest` in the **MsalInterceptorConfig** to a method allows you to dynamically change the auth request. For instance, you may set the authority based on the home tenant of the account when using guest users.
Properties on `authRequest` may be changed, but should always extend the `originalAuthRequest` like below:

```js
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set("https://graph.microsoft.com/v1.0/me", ["user.read"]);
  
  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap,
    authRequest: (msalService, httpReq, originalAuthRequest) => {
      return {
        ...originalAuthRequest,
        authority: `https://login.microsoftonline.com/${originalAuthRequest.account?.tenantId ?? 'organizations'}`
      };
    }
  };
}
...

@NgModule({
  declarations: [...],
  imports: [...],
  providers: [
    ...
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    }
  ]
});

```
