# CDN Usage for @azure/msal-browser

**_NOTE:_** Starting from MSAL.js v3 `msal-browser` is no longer hosted on the CDN. If you consume `msal-browser` from the CDN you will need to download `msal-browser` from npm and choose one of the following alternatives before upgrading:

1. Consume the ESM build (preferred)
1. Extract `lib/msal-browser.js` or `lib/msal-browser.min.js` from the downloaded package and serve it as a static asset with your app or host it on your own CDN.