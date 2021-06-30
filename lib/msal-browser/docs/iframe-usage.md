# Using iframes with MSAL

MSAL.js can be used with iframed applications under restricted conditions:

* You **cannot** iframe the Azure AD login UX itself. Specifically, the service will refuse to render prompts for credential entry and consent by throwing the `X-FRAME OPTIONS SET TO DENY` error. This restriction is imposed to prevent [clickjacking attacks](https://owasp.org/www-community/attacks/Clickjacking).
* Due to the above restriction, you **cannot** use [redirect APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md#redirect-apis) in an iframed app; user interactions with the IdP must be handled via popups (see [below](#error-handling))
* You **can** achieve [single-sign on](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso) between iframed and parent apps running on the same domain **and** on different domains **if** both apps are owned or managed (see [below](#single-sign-on))

> :information_source: Azure AD B2C offers an [embedded sign-in experience](https://docs.microsoft.com/azure/active-directory-b2c/embedded-login) (public preview), which allows rendering a custom login UX in an iframe. Since MSAL prevents redirects in iframe, you'll need to set the [allowRedirectIframe](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md#system-config-options) configuration option to **true** in order to make user of this feature.

## Browser restrictions

Because Azure AD session cookies within an iframe are considered [3rd party cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#third-party_cookies), certain browsers (for example **Safari** or **Chrome** in incognito mode with 3rd party cookies disabled) either block or clear these cookies. This will affect the single sign-on experience for iframed apps as they will not have access to IdP's session cookies.

Additionally, when 3rd party cookies are disabled, the app in the iframe will not have access to local or session storage. MSAL.js will fallback to in-memory storage in this case.

## Single sign-on

iframed and parent apps on the same domain will have access to the same MSAL.js cache instance and will be able to sign-in without prompts. See for more: [Single sign-on with MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso)

iframed and parent apps on different domains can make use of the [ssoSilent()](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#silent-login-with-ssosilent) API. You will need to pass an **account**, a **loginHint** or a **sid** as parameter. To do so, you can make use of the [postMessage()](https://html.spec.whatwg.org/multipage/web-messaging.html#dom-window-postmessage-options-dev) API, use a 3rd party solution (e.g. [postmate](https://github.com/dollarshaveclub/postmate)) or implement a custom message broker. When using `postMessage()` API, please ensure to follow [security considerations](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concerns).

```javascript
// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication({
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        redirectUri: "/redirect", // set to a blank page for handling auth code response via popups
    },
    cache: {
        cacheLocation: "localStorage", // set your cache location to local storage
    },
});

const parentDomain = "http://localhost:3001";
let username = "";

window.addEventListener("message", (event) => {
    // check the origin of the data
    if (event.origin === parentDomain) {
        console.log("Received message: " + event.data);

        // check if username received
        if (username.length === 0) {

            // set username
            username = event.data;

            // attempt SSO
            myMSALObj.ssoSilent({
                loginHint: username
            }).then((response) => {
                // do something with response
            }).catch(error => {
                // handle errors
            });
        }
    }
});
```

## Error handling

You should catch and handle any errors if `ssoSilent()` fails. In particular:

* `InteractionRequiredError`: will be thrown if consent is required, user needs to perform MFA or etc.
* `BrowserAuthError`: will be thrown if no or invalid *account*, *session id* or *login hint* provided

```javascript
    myMSALObj.ssoSilent({
        loginHint: username
    }).then((response) => {
            // do something with response
        }).catch(error => {
            if (error instanceof msal.InteractionRequiredAuthError) {
                myMSALObj.loginPopup()
                    .then((response) => {
                        // do something with response
                    });
            } else if (error instanceof msal.BrowserAuthError) {
                myMSALObj.loginPopup()
                    .then((response) => {
                        // do something with response
                    });
            } else {
                console.log(error);
            }
        });
```

## User interaction

if you like to minimize communication with IdP that requires user interaction, or if you have issues with popups for any reason, you may consider:

* **Avoiding interaction when users sign-in for the first time**
  * [Granting admin consent](https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent) to a tenant will prevent consent prompts for permissions required by your app.
* **Avoiding interaction when calling an API that has permissions requiring consent**
  * [Pre-authorizing client apps](https://docs.microsoft.com/azure/active-directory/develop/reference-app-manifest#preauthorizedapplications-attribute) will prevent consent prompts for permissions required by your web API

## Single sign-out

You can use MSAL.js with a [front-channel logout URI](https://openid.net/specs/openid-connect-backchannel-1_0.html) to achieve *single sign-out* effect between iframed and parent apps. In particular, you may want to enable front-channel logout for your iframed child apps, so that the logout from parent app can trigger logout from child apps. See for more: [How to configure a front-channel logout URI](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/logout.md#front-channel-logout).
