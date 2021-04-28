# Supporting Internet Explorer 11 and Edge Legacy

Msal.js has been tested and supports IE 11 and Edge Legacy. This support will be dropped in the next major version update (v3).

Msal.js is generated for [JavaScript ES5](https://fr.wikipedia.org/wiki/ECMAScript#ECMAScript_Edition_5_.28ES5.29) so that it can run in Internet Explorer. There are, however, a few things to know.

## Providing Promise Polyfills

If you intend to use msal.js in applications that can run in Internet Explorer, you will need to add a reference to a Promise polyfill before referencing the msal.js script. For example:

```JavaScript
 <script src="https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.4/bluebird.min.js" class="pre"></script>
```

This is because Internet Explorer does not support JavaScript promises natively.

## Configuration

When using IE 11 or Legacy Edge browsers you should configure msal to use `localStorage` and to store auth state in cookies. This gets around problems with cache state being cleared on redirects and potentially causing redirect loops.

```javascript
const msalConfig = {
    auth: {
        clientId: "client_id"
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: true
    }
};  
```

You can also configure this to only set `storeAuthStateInCookie: true` if the app is opened in IE11 or Edge:

```javascript
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const msedge = ua.indexOf("Edge/");
const isIE = msie > 0 || msie11 > 0;
const isEdge = msedge > 0;

const msalConfig = {
    auth: {
        clientId: "client_id"
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: isIE || isEdge
    }
};
```

## Security Zones

The session storage and local storage are partitioned by security zones in the IE and Edge browsers. When the application is redirected across zones, the session storage and local storage are cleared. MSAL.js saves certain state in the session storage and relies on checking this state during the authentication flows. When the session storage is cleared, this state is lost and hence results in broken experiences.

Setting `storeAuthStateInCookie: true` should mitigate this, however, if you are still experiencing issues in these browsers (but not others) then you can try adding your application domain, your authority domain (i.e. `login.microsoftonline.com`) and any other sites involved in the authentication flow, as trusted sites in the security settings of the browser so that they belong to the same security zone.

- Open Internet Explorer and click on the settings (gear icon) in the top right corner
- Select Internet Options
- Select the Security tab
- Under the Trusted Sites option, click on the sites button and add the URLs in the dialog box that opens.

## Popups

We recommend using the redirect flow when using IE as there can be problems with popups. If you would like to use popups anyway, this is what you should know:

There are cases when popups are blocked in IE or Edge, for example when a second popup occurs during multi-factor authentication. You will get an alert in the browser to allow for the popup once or always. If you choose to allow, the browser opens the popup window automatically and returns a null handle for it. As a result, the library does not have a handle for the window and there is no way to close the popup window. The same issue does not happen in Chrome when it prompts you to allow popups because it does not automatically open a popup window.

As a workaround, developers will need to allow popups in IE and Edge before they start using their app to avoid this issue.

## To run locally in IE, temporarily disable the "protected mode"

However, if you, as a developer, want to debug locally your application running in Internet Explorer (let's assume in the next paragraph that you want to run your application as http://localhost:1234), you need to be aware of the following:

- Internet Explorer has a security mechanism named "Protected mode" which will prevent msal.js from working correctly. Among the symptoms, after you sign-in, the page can be redirected to http://localhost:1234/null.
- To run and debug your application locally, you'll need to disable this "protected mode". For this:
  - go to Internet Explorer Settings (the gear icon)
  - then choose Internet Options | Security, click on the Internet zone, and **uncheck "Enable Protected Mode** (requires restarting Internet Explorer)". Internet Explorer will complain that your computer is no longer protected. Acknowledge
  - restart Internet explorer
  - Run and debug your application

When you are done, restore Internet explorer security settings by going to IE Settings | Internet Options | Security | **Reset all zones to default level**

## Known issues

### Internet Explorer

- [IE doesn't properly handle caching of openid-configuration across subdomains](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/2974)

## Sample Application

You'll find a sample application that can be run in IE11 [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/ie11-sample)
