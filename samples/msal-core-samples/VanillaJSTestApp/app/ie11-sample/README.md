# IE11/Edge Browser Compatibility Considerations

In order to properly support IE11 there are a few things to keep in mind:

- Your app will need to provide a promise polyfill, such as **Bluebird**
- We recommend using **Redirect flow** as there are situations where popups are blocked
- We recommend setting `storeAuthStateInCookie` to true in your `msalConfig.cache` to prevent looping issues
- Ensure your app and your **authority domain** (such as `login.microsoftonline.com`) are both added as **Trusted Sites** in the same **Security Zone**

You can read more about these considerations in detail [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Known-issues-on-IE-and-Edge-Browser)
