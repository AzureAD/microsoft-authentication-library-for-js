# FAQ

## Migrating APPS from ADAL to MSAL

If your application is currently using ADAL JS for authentication and you want to migrate to MSAL JS, please contact the `msal js` team. We are working on publishing the migration guide and it will be added here soon.

ADAL JS currently is in maintanence mode and we are accepting only security fixes into our ADAL libraries. All new feature work and enhancements are going to be in MSAL only.

## ADAL vs MSAL

MSAL.js integrates with the Azure AD v2.0 endpoint, whereas ADAL.js integrates with the Azure AD v1.0 endpoint. The v1.0 endpoint supports work accounts, but not personal accounts. The v2.0 endpoint is the unification of Microsoft personal accounts and work accounts into a single authentication system. Additionally, with MSAL.js you can also get authentications for Azure AD B2C. More details on the evolution of Microsoft Identity Platform and a summary of v1.0 vs v2.0 endpoints can be found [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/about-microsoft-identity-platform).

## Token versions
You can acquire both v1.0 and v2.0 tokens and use v1.0 tokens against the v1.0 APIs with MSAL.js.

Please refer to [choosing between ADAL JS and MSAL JS](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-compare-msal-js-and-adal-js#choosing-between-adaljs-and-msaljs) documentation for more details.



