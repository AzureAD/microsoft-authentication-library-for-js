# Authoring an application which will run in Internet Explorer

Msal.js is generated for [JavaScript ES5](https://fr.wikipedia.org/wiki/ECMAScript#ECMAScript_Edition_5_.28ES5.29) so that it can run in Internet Explorer. There are, however, a few things to know.

If you intend to use msal.js in applications that can run in Internet Explorer, you will need to add a reference to a promise polyfill before referencing the msal.js script.
```JavaScript
 <script src="https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.4/bluebird.min.js" class="pre"></script>
```
This is because Internet Explorer does not support JavaScript promises natively.

## Debugging an application which will run in Internet Explorer
### This just works in production
If you deploy your application to production (for instance in [Azure Web apps](https://docs.microsoft.com/en-us/azure/app-service-web/)), this will normally work fine, provided the end user has accepted popups. We tested it with Internet Explorer 11.

### To run locally in IE, temporarily disable the "protected mode" .
However, if you, as a developer, want to debug locally your application running in Internet Explorer (let's assume in the next paragraph that you want to run your application as http://localhost:1234), you need to be aware of the following:
- Internet Explorer has a security mechanism named "Protected mode" which will prevent msal.js to work correctly. Among the symptoms, after you sign-in, the page can be redirected to http://localhost:1234/null.

- To run and debug your application locally, you'll need to disable this "protected mode". For this:
  - go to Internet Explorer Settings (the gear icon)
  - then choose Internet Options -> Security, click on the Internet zone, and **uncheck "Enable Protected Mode** (requires restarting Internet Explorer)". Internet Explorer will complain that your computer is no longer protected. Acknowledge
  - restart Internet explorer
  - Run and debug your application

When you are done, restore Internet explorer security settings by going to IE Settings -> Internet Options -> Security -> **Reset all zones to default level**

# Issues due to security zones
We had multiple reports of issues with authentication in IE and Edge (since the update of the *Microsoft Edge browser version to 40.15063.0.0*). We are tracking these and have informed the Edge team. While Microsoft Edge works on a resolution, here is a description of the frequently occurring issues and the possible workarounds that can be implemented.

## Cause
The cause for most of these issues is as follows. The session storage and local storage are partitioned by security zones in the Edge browser. In this particular version of Edge, when the application is redirected across zones, the session storage and local storage are cleared. Specifically, the session storage is cleared in the regular browser navigation, and both the session and local storage are cleared in the InPrivate mode of the browser. MSAL.js saves certain state in the session storage and relies on checking this state during the authentication flows. When the session storage is cleared, this state is lost and hence results in broken experiences.

## Issues

- **Infinite redirect loops and page reloads during authentication**  
When users login to the application on Edge, they are redirected back from the AAD login page and are stuck in an infinite redirect loop resulting in repeated page reloads. This is usually accompanied by an `invalid_state` error in the session storage.

- **Infinite acquire token loops and AADSTS50058 error**
When an application running on Edge tries to acquire a token for a resource, the application may get stuck in an infinite loop of the acquire token call along with the error below from AAD in your network trace.  
```
Error: login_required; 
Error description: AADSTS50058: A silent sign-in request was sent but no user is signed in. The cookies used to represent the user's session were not sent in the request to Azure AD. This can happen if the user is using Internet Explorer or Edge, and the web app sending the silent sign-in request is in different IE security zone than the Azure AD endpoint (login.microsoftonline.com)
```

- **Popup window doesn't close or is stuck when using login through Popup to authenticate**     
When authenticating through popup window in Edge or IE(InPrivate), after entering credentials and signing in, if multiple domains across security zones are involved in the navigation, the popup window doesn't close because MSAL.js loses the handle to the popup window.  

Here are links to these issues in the Edge issue tracker:  
- [Bug 13861050](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13861050/)
- [Bug 13861663](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13861663/)

## Update: Fix available in MSAL.js 0.2.3
Fixes for the authentication redirect loop issues have been released in [MSAL.js 0.2.3](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases). Please enable the flag `storeAuthStateInCookie` in the MSAL.js config to take advantage of this fix. By default this flag is set to false.

When the `storeAuthStateInCookie` flag is enabled, MSAL.js will use the browser cookies to store the request state required for validation of the auth flows.

**Note**: 
* This fix is not yet available for the msal-angular and msal-angularjs wrappers. 
* This fix does not address the issue with Popup windows.

Please use workarounds below.
### Other workarounds
Please make sure to test that your issue is occurring only on the specific version of Edge browser and works on the other browsers before adopting these workarounds.  
1. As a first step to get around these issues, please ensure that the application domain, `login.microsoftonline.com` and any other sites involved in the redirects of the authentication flow are added as trusted sites in the security settings of the browser, so that they belong to the same security zone.
To do so, please follow these steps:
- Open **Internet Explorer** and click on the **settings** (gear icon) in the top right corner
- Select **Internet Options**
- Select the **Security** tab
- Under the **Trusted Sites** option, click on the **sites** button and add the URLs in the dialog box that opens.

2. As mentioned before, since only the session storage is cleared during the regular navigation, you may configure MSAL.js to use the local storage instead. This can be set as the `cacheLocation` config parameter while initializing MSAL.

Please note, this will not solve the issue for InPrivate browsing since both session and local storage are cleared.

# Issues due to popup blockers

There are cases when popups are blocked in IE or Edge, for example when a second popup occurs during multi-factor authentication. You will get an alert in the browser to allow for the popup once or always. If you choose to allow, the browser opens the popup window automatically and returns a `null` handle for it. As a result, the library does not have a handle for the window and there is no way to close the popup window. The same issue does not happen in Chrome when it prompts you to allow popups because it does not automatically open a popup window.

As a **workaround**, developers will need to allow popups in IE and Edge before they start using their app to avoid this issue.
