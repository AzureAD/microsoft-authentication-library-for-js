Security vulnerability details for passport-azure-ad <1.4.6, 2.0.0
===================

Our team discovered a vulnerability in the Passport-Azure-AD for NodeJS library affecting versions <1.4.6 and 2.0.0. This vulnerability can allow a user to bypass certain authentication mechanisms. Developers using the Passport-Azure-AD for NodeJS library need to download the latest version of the Passport-Azure-AD for NodeJS library. 

> - **if you are currently on 1.x below 1.4.6, please update to 1.4.6 or
>   greater**
> - **if you are currently on 2.0.0, please update to 2.0.1 or
>   greater**

Updated packages are available on npm. To ensure you get additional bug fixes going forward, please ensure your package.json file is updated to take PATCH and MINOR level updates of our libraries. 

#### Example for 2.0 release: 
```sh
{ 
  "dependencies": { 
    "passport-azure-ad": "^2.0.1"
  } 
} 
```
#### Example for 1.4 release:  
```sh
{ 
  "dependencies": { 
    "passport-azure-ad": "^1.4.6" 
  } 
} 
```
### Upgrade Notes

1. This patch updates the library that your application runs, but does not change the current state of your users, including any sessions they had open. This applies to malicious users who could have exploited this vulnerability to gain access to your system. If your application has users with existing sessions open, after applying the patch, ensure all these sessions are terminated and users are required to sign in again. 


2. In previous versions of the Passport-Azure-AD for NodeJS library, the issuer wasn't validated, even if you had set validateIssuer to true in your configuration. This is fixed in versions 1.4.6 and 2.0.1. However, this may mean you get 401s if you are using the common endpoint in the identityMetadata config setting and have validateIssuer to true. If you are using the "common" endpoint (which looks like "https://login.microsoftonline.com/common/.well-known/openid-configuration"), issuers cannot be validated. You can fix this in two ways: 

 - If you are a single-tenant app, you can replace 'common' with your tenantId in the endpoint address. The issuer will be validated. IdentityMetadata set to support a single tenant should look like "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011dddd/.well-known/openid-configuration" with your tenant GUID replaced in the path or "https://login.microsoftonline.com/your-tenant-name.onmicrosoft.com/.well-known/openid-configuration" with your tenant name replaced in the path.

 - If you are a multi-tenant app and need to go against the common endpoint, you must set validateIssuer to false. Be aware that the issuer field of the token will not be validated and all issuers will be accepted. 

You can read more about the [issue here].

[//]: # (These are reference links used in the body of this note.)
   [issue here]: http://support.microsoft.com/kb/3187742
