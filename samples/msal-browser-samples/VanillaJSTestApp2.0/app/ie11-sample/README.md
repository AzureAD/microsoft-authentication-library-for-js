# IE11/Edge Browser Compatibility Considerations

In order to properly support IE11 there are a few things to keep in mind:

- Your app will need to provide a promise polyfill, such as **Bluebird**
- We recommend using **Redirect flow** as there are situations where popups are blocked
- We recommend setting `storeAuthStateInCookie` to true in your `msalConfig.cache` to prevent looping issues
- Ensure that your app and your **authority domain** (such as `login.microsoftonline.com`) are both in the same **security zone** (i.e. "Trusted Sites" is recommended)"

You can read more about these considerations in detail [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser/docs/internet-explorer.md)
