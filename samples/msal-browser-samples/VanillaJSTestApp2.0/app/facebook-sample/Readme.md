# MSAL.js Sample - Authorization Code Flow for Non-Microsoft Identity Providers

## About this sample

This developer sample is used to demonstrate how to configure an app for use with non-Microsoft identity providers by using Facebook as an example.

## How to run the sample:

-   Replace client ID with the app ID from the basic settings page of the app registration on the [Meta for Developers page](https://developers.facebook.com/).

## Important changes when using non-Microsoft identity providers

-   You must change the authority in the config to an authority supported by the identity provider. Additionally, for non-Microsoft authorities, you must add the authority (without the https://) to the knownAuthorities parameter in the config.
-   You must set the protocol mode to OIDC.
-   You have the option of configuring different authentication options when using OIDC protocol mode. These are set in the OIDCOptions parameter.
    -   The `serverResponseType` parameter sets the format supported by MSAL for requests and server responses. Supported options are:
        -   `ServerResponseType.FRAGMENT` (for a hash fragment). If not set, MSAL defaults to `ServerResponseType.FRAGMENT`. If supported by the identity provider, we highly recommend using `ServerResponseType.FRAGMENT`.
        -   `ServerResponseType.QUERY` (for a query parameter). We recommend using `ServerResponseType.QUERY` only if the identity provider does not support sending server responses in a hash fragment.
    -   The `defaultScopes` parameter provides the option to override the default scopes sent by MSAL. If not set, it defaults to ["openid", "profile", "offline_access"]. If `defaultScopes` does not include "openid", MSAL will automatically add it for OIDC compliance.
-   You have the option to manually configure endpoints used by the identity provider. If not set, MSAL will attempt to discover the endpoints. Manual endpoint configuration should be passed in a stringified JSON object and include issuer, authorization_endpoint, token_endpoint, jwks_uri, and (if available) end_session_endpoint.
-   You must not set allowPlatformBroker to true when using a non-Microsoft identity provider.
-   If the identity provider does not have an end_session_endpoint, MSAL will not automatically redirect the page upon logout.
