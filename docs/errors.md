# Errors
1. [I get this error "Access to fetch at [url] has been blocked by CORS policy"](#I-get-this-error-Access-to-fetch-at-[url]-has-been-blocked-by-CORS-policy")

## I get this error "Access to fetch at [url] has been blocked by CORS policy"

This error occurs with MSAL.js v2.x and is due to improper configuration during **App Registration** on **Azure Portal**. In particular, you should not have both `Web` and `Single-page application` added as a platform under the **Authentication** blade in your App Registration.