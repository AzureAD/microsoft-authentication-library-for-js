# FAQs

# How do I get an authorization code from the library?

Currently the msal-browser package is designed for Single-Page Applications that are handling all authentication through the browser client. We have not yet optimized this to work with server-side components. As such, requests to retrieve the authorization code from the first leg of the flow can't be met currently. We are currently working on an [implementation of msal that will run in node libraries](https://github.com/AzureAD/microsoft-authentication-library-for-js/projects/4), and as part of that we will explore options to make msal-browser work with server-side components.

# Does this library work for iframed applications?

We are currently working on support for iframed applications as well as solutions for applications affected by ITP 2.x changes. You can monitor the first of those tickets [here](#1410).

# Will MSAL 2.x support B2C?

We are currently working with the B2C service team to allow for authorization code flow to work in the browser with B2C tenants. We hope to have this available shortly after release.

# Common Error Handling 

1. If you try to use Auth Code flow and see this error: `access to XMLHttpRequest at 'https://login.microsoftonline.com/common/v2.0/oauth2/token' from origin 'yourApp.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`, you will need to update your redirect URI to be tagged type 'spa' rather than type 'web'. You can do this in your app manifest or [in the Azure Portal](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration). 
