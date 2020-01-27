# MSAL JS: `1.2.1` release:
This is a minor patch release which addresses the feedback we received on `msal@1.2.0` from B2C customers.

## Release details
* `isAngular` flag removal from `redirect` use cases(#1193)
* `urlContainsHash()` is restored as a public API (#1202)
* `allow-forms` added in sandbox properties for the iframes created by `msal js` to support certain B2C scenarios(#1191)

# MSAL JS: `1.2.0` release:

As many of you increasingly write embedded SPA applications in iframes hosted by other applications (e.g: Sharepoint, Teams, Office and other platforms), it became imperative for MSAL.js to support this scenario.

This release includes support for authentication in applications embedded in iframes. Our solution also improves performance, which is especially visible for heavy SPAs which reload on redirect as we no longer run scripts on the service redirect. With this new release of `msal js`: `1.2.0` you can now use `acquireTokenSilent()` when your app is embedded in an iframe.The library also avoids reloading the entire page for silent/popup calls (in the hidden iframe or the popup window respectively) which results in improved performance and better user experience.

## Features:
### Iframes Support and Performance enhancements

**Details:**

- Previously, any page configured as the `redirectUrl` (at app registration in the azure portal) is required to run `msal js` to successfully resolve a token after the server redirect(302). With the enhancements in this release, it is not longer the case.
- As a result of the work, you will observe performance improvements, especially for heavy SPAs. We are blocking any scripts from running in the hidden iframes created by the `acquireTokenSilent()` calls, preventing the reload. We also added monitoring to the popups and iframes created by `msal js` during token acquisition to reduce the wait time for processing the response.
- To further enhance your SPA's performance, you can now set an empty page for the application to redirect to (Say auth.html) during authentication. Specifically, the `redirectUri` set in app portal can be an empty page: https://yourhost/auth.html instead of the SPA's homepage.#### Allow user to set request specific `redirectUri`
- Users can now set a 'redirectUri` for a given request. This feature gives the application flexibility to design silent and interactive redirects separately.
- We allow scripts in the sandboxed iframes for silent calls, as the service end mandates scripts:
`ifr.setAttribute("sandbox", "allow-scripts allow-same-origin");`
Hence if there are any scripts running in the redirect page, msal.js will now only block token requests and you will observe console logs as below:

![BlockTokenRequestsError](https://user-images.githubusercontent.com/21958742/70196329-42965580-16bd-11ea-869b-8f1b4d048e6d.jpg)

To avoid this, it is recommended to set the `redirectUri` for the silent calls to a blank page, say https://yourhost/auth.html instead of the SPA's homepage. Please check the sample [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/1150/) for the usage.

### Concurrent requests for `acquireTokenSilent()`

Users can now make concurrent requests to get tokens calling `acquireTokenSilent()`, the cache design now implements the necessary changes to facilitate this.

### Multiple instances of `msal js` are supported

`msal js` now supports multiple instances in a given app environment, however we recommend the user to understand the cache model before opting for this, as this would lead to token sharing for shared cache scenarios.

## What does this mean for the Public APIs:

**`acquireTokenSilent()`, `loginPopup()`, `acquireTokenPopup()`:** 
- There is no change in the public API. Calling `acquireTokenSilent()`, `loginPopup()` or `acquireTokenPopup()` in an iframe remains similar to calling them in a full browser window.

## Supported Applications:

This new release `msal js`: `1.2.0` will now enable the below popular web app scenarios:
- SharePoint web and the embedded applications in the SPO environment
- Teams tabs in full browser scenarios
- Office AddIns
- Apps in any SPA embedded in iframes

## Redirect APIs

**`acquireTokenRedirect()`, `loginRedirect()`:**
- In order to prevent [clickjacking](https://www.owasp.org/index.php/Clickjacking), any interaction is blocked in an iframe by the Microsoft Identity. Hence if you try to call `acquireTokenRedirect()`/`loginRedirect()` in an app embedded in an iframe, it wouldn't work.
- To solve this scenario and provide support for certain app architectures to use these APIs, we have architected a solution which allows the top-framed application to implement the redirect flow on behalf of the embedded (in an iframe) application.
- Samples for this use case will be announced soon, we are working on a specific scenario for `Teams` which requires supporting redirect APIs in popups.

## CDN Release
- CDN release and SRI hashes are available [here](./cdn-usage.md).
