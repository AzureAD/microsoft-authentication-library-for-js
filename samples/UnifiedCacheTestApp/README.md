This sample demonstrates Unified Cache feature in MSAL JS library.

MSAL.js brings feature parity with ADAL.js for Azure AD authentication scenarios.  To make the migration from ADAL.js to MSAL.js easy and to avoid prompting your users to sign in again, the library reads the ID token representing user’s session in ADAL.js cache, and seamlessly signs in the user in MSAL.js.

To take advantage of the single sign-on (SSO) behavior when updating from ADAL.js, you will need to ensure the libraries are using `localStorage` for caching tokens. Set the `cacheLocation` to `localStorage` in both the MSAL.js and ADAL.js configuration, mode details on the usage [here.](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-sso#sso-in-adaljs-to-msaljs-update)
