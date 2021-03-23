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

## Multi-tenant access tokens

By default the MsalInterceptor will retrieve access tokens from the users' primary tenant. You can however override this behavior by setting a dynamic auth request on the MsalInterceptorConfig.

```js
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set("https://graph.microsoft.com/v1.0/me", ["user.read"]);
  
  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap,
    authRequest: {
      authority: 'https://login.microsoftonline.com/organizations',
    },
    dynamicAuthRequest: (authRequest, httpReq) => {
      return {
        ...authRequest,
        authority: `https://login.microsoftonline.com/${authRequest.account?.tenantId ?? 'organizations'}`
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